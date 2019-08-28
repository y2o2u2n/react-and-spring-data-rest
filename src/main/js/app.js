'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const when = require('when');
const client = require('./client');
const follow = require('./follow');
const stompClient = require('./websocket-listener');

const root = '/api';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {messages: [], attributes: [], page: 1, pageSize: 2, links: {}};
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
        this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
    }

    loadFromServer(pageSize) {
        follow(
            client,
            root,
            [{rel: 'messages', params: {size: pageSize}}]
        ).then(messageCollection => {
            return client({
                method: 'GET',
                path: messageCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                this.links = messageCollection.entity._links;
                return messageCollection;
            });
        }).then(messageCollection => {
            this.page = messageCollection.entity.page;
            return messageCollection.entity._embedded.messages.map(message =>
                client({
                    method: 'GET',
                    path: message._links.self.href
                })
            );
        }).then(messagePromises => {
            return when.all(messagePromises);
        }).done(messages => {
            this.setState({
                page: this.page,
                messages: messages,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    onCreate(newMessage) {
        follow(client, root, ['messages']).done(response => {
                client({
                    method: 'POST',
                    path: response.entity._links.self.href,
                    entity: newMessage,
                    headers: {'Content-Type': 'application/json'}
                })
        })
    }

    onUpdate(message, updatedMessage) {
        client({
            method: 'PUT',
            path: message.entity._links.self.href,
            entity: updatedMessage,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': message.headers.Etag
            }
        }).done(response => {
            /* Let the websocket handler update the state */
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' + message.entity._links.self.href + '. Your copy is stale.');
            }
        });
    }

    onDelete(message) {
        client({method: 'DELETE', path: message.entity._links.self.href});
    }

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(messageCollection => {
            this.links = messageCollection.entity._links;
            this.page = messageCollection.entity.page;

            return messageCollection.entity._embedded.messages.map(message =>
                client({
                    method: 'GET',
                    path: message._links.self.href
                })
            );
        }).then(messagePromises => {
            return when.all(messagePromises);
        }).done(messages => {
            this.setState({
                page: this.page,
                messages: messages,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    refreshAndGoToLastPage(message) {
        follow(client, root, [{
            rel: 'messages',
            params: {size: this.state.pageSize}
        }]).done(response => {
            if (response.entity._links.last !== undefined) {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }

    refreshCurrentPage(message) {
        follow(client, root, [{
            rel: 'messages',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(messageCollection => {
            this.links = messageCollection.entity._links;
            this.page = messageCollection.entity.page;

            return messageCollection.entity._embedded.messages.map(message => {
                return client({
                    method: 'GET',
                    path: message._links.self.href
                })
            });
        }).then(messagePromises => {
            return when.all(messagePromises);
        }).then(messages => {
            this.setState({
                page: this.page,
                messages: messages,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
            {route: '/topic/newMessage', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updateMessage', callback: this.refreshCurrentPage},
            {route: '/topic/deleteMessage', callback: this.refreshCurrentPage}
        ]);
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <MessageList page={this.state.page}
                          messages={this.state.messages}
                          links={this.state.links}
                          pageSize={this.state.pageSize}
                          attributes={this.state.attributes}
                          onNavigate={this.onNavigate}
                          onUpdate={this.onUpdate}
                          onDelete={this.onDelete}
                          updatePageSize={this.updatePageSize}/>
            </div>
        )
    }
}

class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const newMessage = {};
        this.props.attributes.forEach(attribute => {
            newMessage[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newMessage);

        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>>
            </p>
        );

        return (
            <div>
                <a href="#createMessage">Create</a>

                <div id="createMessage" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new message</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const updatedMessage = {};
        this.props.attributes.forEach(attribute => {
            updatedMessage[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.message, updatedMessage);
        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={this.props.message.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.message.entity[attribute]}
                       ref={attribute} className="field"/>
            </p>
        );

        const dialogId = "updateMessage-" + this.props.message.entity._links.self.href;

        return (
            <div key={this.props.message.entity._links.self.href}>
                <a href={"#" + dialogId}>Update</a>

                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an message</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class MessageList extends React.Component {
    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault();
        const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        const pageInfo = this.props.page.hasOwnProperty("number") ?
            <h3>Messages - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        const messages = this.props.messages.map(message =>
            <Message key={message.entity._links.self.href}
                  message={message}
                  attributes={this.props.attributes}
                  onUpdate={this.props.onUpdate}
                  onDelete={this.props.onDelete}/>
        );

        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                {pageInfo}
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                    <tr>
                        <th>Title</th>
                        <th></th>
                        <th></th>
                    </tr>
                    {messages}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

class Message extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.message);
    }

    render() {
        return (
            <tr>
                <td>{this.props.message.entity.content}</td>
                <td>
                    <UpdateDialog message={this.props.message}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App/>,
    document.getElementById('react')
)

