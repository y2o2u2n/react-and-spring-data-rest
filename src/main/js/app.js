'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {messages: []};
    }

    componentDidMount() {
        client({method: 'GET', path: '/api/messages'}).done(response => {
            this.setState({messages: response.entity._embedded.messages});
        });
    }

    render() {
        return (
            <MessageList messages={this.state.messages}/>
        )
    }
}

class MessageList extends React.Component {
    render() {
        const messages = this.props.messages.map(message =>
            <Message key={message._links.self.href} message={message}/>
        );
        return (
            <table>
                <tbody>
                <tr>
                    <th>content</th>
                </tr>
                {messages}
                </tbody>
            </table>
        )
    }
}

class Message extends React.Component {
    render() {
        return (
            <tr>
                <td>{this.props.message.content}</td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)

