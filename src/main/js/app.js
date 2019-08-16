'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {rooms: []};
    }

    componentDidMount() {
        client({method: 'GET', path: '/api/rooms'}).done(response => {
            this.setState({rooms: response.entity._embedded.rooms});
        });
    }

    render() {
        return (
            <RoomList rooms={this.state.rooms}/>
        )
    }
}

class RoomList extends React.Component {
    render() {
        const rooms = this.props.rooms.map(room =>
            <Room key={room._links.self.href} room={room}/>
        );
        return (
            <table>
                <tbody>
                <tr>
                    <th>title</th>
                </tr>
                {rooms}
                </tbody>
            </table>
        )
    }
}

class Room extends React.Component {
    render() {
        return (
            <tr>
                <td>{this.props.room.title}</td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)

