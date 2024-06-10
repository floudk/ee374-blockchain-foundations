# Networking

Use `TypeScript` to implement a simple `Marabu` node, and exchange a 'hello' message with any peer node.

Since auto-grade system can not be accessed from not in-class students, `test.sh` may be used to test the implementation. However, the test script written by myself can not be guaranteed to be correct.

## Networking Protocol

P2P network works over TCP, if your node is running behind NAT, you need to setup port forwarding.

The code must be able to support connections to multiple nodes at the same time, and message should be encoded in canonical JSON format.

- Multiple connections: server port should not be blocked and only work for receiving new connection requests.




## Bootstrapping
Node should initially connect to a list of known peers and then build its own list of known peers.

## Data validation

Client must disconnect from their peer in case they receive invalid data. Be rigorous about network data validation and do not accept malformed data.

