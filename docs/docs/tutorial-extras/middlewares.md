---
sidebar_position: 3
---

# Middleware

TODO: ????

## types of middleware

There are 3 types of middlewares you can create:

### functional middlewares

similar to expressjs middlewares they are just functions that are executed at each request.
the major point is you need to call `await next()`, otherwise you can break the promise chain and cause unpredictable behaviors.

### Middleware Class

it is a class definition that extends Middleware class. Everytime a request is processed, a new instance of this class is created before executing the middleware part.
This is ideal for when you need to run a middleware where it needs to track some data from before and acter controller execution per each request.

### Middleware Object

There may exists situations where you want to save performance and not instantiate on every request.
or you want to be able to track data between requests.

## order of middleware execution

1. from global router
2. from class middlewares
3. from request method of controller class
