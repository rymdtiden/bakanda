# Bakanda

A node.js GraphQL back-end famework.

## UNDER CONSTRUCTION

This documentation is under construction.

The codebase is not in version 1 (yet).

Be patient!

## Registry

### Available properties in second argument object

Generic for all functions:
* `state` - The current state object.
* `log` - A scoped log function.
* `reg` - A scoped function registry object.
* `passhasher` - Function for hashing passwords.
* `passhasherSync` - Synchronous function for hashing password.
* `validatePasshash` - Function for validating a hashed password.
* `createToken` - Function for creating a JWT token.
* `parseToken` - Function for parsing a JWT token.
* `randStr` - Function which returns a random string.
* `generateId` - Function which returns a unique ID.
* `timestampFromId` - Function which returns the creation time of an ID.
* `validIdForm` - Function for validating the format of an ID string.
* `jwtPublicKey` - The public key used for JWT tokens. (String.)

for command only:

* `addEvent` - The function for adding another event to the event log.

For commands and queries only:

* `req` - The expressjs `req` request object.
* `res` - The expressjs `res` response object.
* `requestId` - The unique ID for the current HTTP(S) request.
* `session` - The session object (if there is a session).

NOTE: Command/query functions can be called directly from within a validator
or a projection. In those cases, the command/query will (of course) NOT have
a `req`, `res`, `requestId` or `session`, since it is not in the scope of a
specific HTTP(S) request.

For event validators and event projectors only:

* `meta` - Metadata object for the event.


## Session handling

###


## Todo

* Always pass along the logged in user in all events, so the user can be used
  in validators and projectors. (In event meta?)
* More automated way to identify function roles (validators, commands,
  projectors, queries) through the function names. Connect event types to
  validators and projectors by function names.
* More automated way to tie formatters to graphql data types.
* Generic user features built in to bakanda.
* Error classes in registry? Or automated creation of error classes by proxies?
* Streaming CSV data storage to disk, with helpers for filtering, etc.
* Generic queryfunctions, just mapping some part of the state to a type (and
  then to a formatter connected to the type). Checking parameter names
  would make it possible to map id parameters to id values of items in an
  array in state.
