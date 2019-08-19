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
        this.state = {rooms: [], attributes: [], page: 1, pageSize: 2, links: {}};
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
            [{rel: 'rooms', params: {size: pageSize}}]
        ).then(roomCollection => {
            return client({
                method: 'GET',
                path: roomCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                this.links = roomCollection.entity._links;
                return roomCollection;
            });
        }).then(roomCollection => {
            this.page = roomCollection.entity.page;
            return roomCollection.entity._embedded.rooms.map(room =>
                client({
                    method: 'GET',
                    path: room._links.self.href
                })
            );
        }).then(roomPromises => {
            return when.all(roomPromises);
        }).done(rooms => {
            this.setState({
                page: this.page,
                rooms: rooms,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    onCreate(newRoom) {
        follow(client, root, ['rooms']).done(response => {
                client({
                    method: 'POST',
                    path: response.entity._links.self.href,
                    entity: newRoom,
                    headers: {'Content-Type': 'application/json'}
                })
        })
    }

    onUpdate(room, updatedRoom) {
        client({
            method: 'PUT',
            path: room.entity._links.self.href,
            entity: updatedRoom,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': room.headers.Etag
            }
        }).done(response => {
            /* Let the websocket handler update the state */
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' + room.entity._links.self.href + '. Your copy is stale.');
            }
        });
    }

    onDelete(room) {
        client({method: 'DELETE', path: room.entity._links.self.href});
    }

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(roomCollection => {
            this.links = roomCollection.entity._links;
            this.page = roomCollection.entity.page;

            return roomCollection.entity._embedded.rooms.map(room =>
                client({
                    method: 'GET',
                    path: room._links.self.href
                })
            );
        }).then(roomPromises => {
            return when.all(roomPromises);
        }).done(rooms => {
            this.setState({
                page: this.page,
                rooms: rooms,
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
            rel: 'rooms',
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
            rel: 'rooms',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(roomCollection => {
            this.links = roomCollection.entity._links;
            this.page = roomCollection.entity.page;

            return roomCollection.entity._embedded.rooms.map(room => {
                return client({
                    method: 'GET',
                    path: room._links.self.href
                })
            });
        }).then(roomPromises => {
            return when.all(roomPromises);
        }).then(rooms => {
            this.setState({
                page: this.page,
                rooms: rooms,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
            {route: '/topic/newRoom', callback: this.refreshAndGoToLastPage},
            {route: '/topic/updateRoom', callback: this.refreshCurrentPage},
            {route: '/topic/deleteRoom', callback: this.refreshCurrentPage}
        ]);
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <RoomList page={this.state.page}
                          rooms={this.state.rooms}
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
        const newRoom = {};
        this.props.attributes.forEach(attribute => {
            newRoom[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newRoom);

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
                <a href="#createRoom">Create</a>

                <div id="createRoom" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new room</h2>

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
        const updatedRoom = {};
        this.props.attributes.forEach(attribute => {
            updatedRoom[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.room, updatedRoom);
        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={this.props.room.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.room.entity[attribute]}
                       ref={attribute} className="field"/>
            </p>
        );

        const dialogId = "updateRoom-" + this.props.room.entity._links.self.href;

        return (
            <div key={this.props.room.entity._links.self.href}>
                <a href={"#" + dialogId}>Update</a>

                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an room</h2>

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

class RoomList extends React.Component {
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
            <h3>Rooms - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

        const rooms = this.props.rooms.map(room =>
            <Room key={room.entity._links.self.href}
                  room={room}
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
                    {rooms}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

class Room extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.room);
    }

    render() {
        return (
            <tr>
                <td>{this.props.room.entity.title}</td>
                <td>
                    <UpdateDialog room={this.props.room}
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

