# Networking

Use `TypeScript` to implement a simple `Marabu` node, and exchange a 'hello' message with any peer node.

Since auto-grade system can not be accessed from not in-class students, `test.sh` may be used to test the implementation. However, the test script written by myself can not be guaranteed to be correct.

- [x] Decide what programming language you will use: TypeScript as being recommended.
- [x] Find a nice name for the node.

- [x] Implement the networking core of your node:
    - [x] listen to TCP port for connections and also be able to initiate connections to other nodes.
    - [x] Support connections to multiple nodes at the same time.
- [x] Implement canonical JSON encoding for messages as per the format specified in protocol, and it's free to use library functions in `json-canonicalize`.

- [x] On receiving data from a connected node, decode and parse it as a JSON string. If the received message is not a valid JSON or doesn’t parse into one of the valid message types, send an "INVALID_FORMAT" error to the node, And when JSON strings are not in canonical form, it should be considered as valid message nevertheless.

- [x] single message may get split across different packets, and a packet may also contain multiple messages which separated by a newline character '\n'.

- [x] When you connect to a node or another node connects to you, send a "hello"
message with the specified format.

- [x] If a connected node sends any other message of a valid format prior to the hello message, you must send an "INVALID_HANDSHAKE" error message to the node and then close the connection with that node.

# Peer Discovery

- [x] Hard-code a list of bootstrapping peers identified by their IP addresses
- [ ] Store a list of discovered peers (including the bootstrapping peers above) locally. The list should survive reboots.
- [ ] On loading the Marabu node, connect to at least one of your discovered peers.
- [ ] Upon connection with any peer (initiated either by your node or the peer), send a
"getpeers" message immediately after the "hello" message.
- [ ] On receiving a "peers" message from a connected peer, update your list of discovered
peers.
- [ ] Optional: Devise a policy to decide how many and which peers to connect to.