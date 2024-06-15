# Networking

Use `TypeScript` to implement a simple `Marabu` node, and exchange a 'hello' message with any peer node.

Since auto-grade system can not be accessed from not in-class students, `test.sh` may be used to test the implementation. However, the test script written by myself can not be guaranteed to be correct.


- [x] Decide what programming language you will use: TypeScript as being recommended.
- [x] Find a nice name for the node.
- [ ] Read the [protocol](https://ee374.stanford.edu/protocol): 
    1. Networking

        P2P network works over TCP, if your node is running behind NAT, you need to setup port forwarding.

        The code must be able to support connections to multiple nodes at the same time, and message should be encoded in canonical JSON format.

        - Multiple connections: server port should not be blocked and only work for receiving new connection requests.



    2. Bootstrapping
        Node should initially connect to a list of known peers and then build its own list of known peers.

    3. Data validation

        Client must disconnect from their peer in case they receive invalid data. Be rigorous about network data validation and do not accept malformed data.

- [x] Implement the networking core of your node:
    - [x] listen to TCP port for connections and also be able to initiate connections to other nodes.
    - [x] Support connections to multiple nodes at the same time.
- [x] Implement canonical JSON encoding for messages as per the format specified in protocol, and it's free to use library functions in `json-canonicalize`.

- [ ] On receiving data from a connected node, decode and parse it as a JSON string. If the received message is not a valid JSON or doesn’t parse into one of the valid message types, send an "INVALID_FORMAT" error to the node.

    Note that: a single message may get split across different packets, and a packet may also contain multiple messages which separated by a newline character '\n'.

    And when JSON strings are not in canonical form, it should be considered as valid message nevertheless.