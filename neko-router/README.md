# @devbro/neko-router

cool routing solution for choosing the code that runs for a given URI.

## supported features

- support controller and function as main executor
- middleware support both as class and function
- singleton middleware and new instance per request middleware
- support route variables

## example

```ts
import {Router, Request, Response} from '@devbro/neko-router';
const router: Router = new Router();

router.addRoute(['GET', 'HEAD'], '/api/v1/countries', async (req: Request, res: Response) => {
    return 'GET countries';
});

router
    .addRoute(['POST'], '/api/v1/countries', async (req: Request, res: Response) => {
    return 'POST countries';
    })
    .addMiddleware([m1, m2]);

    router.addRoute(
      ['GET'],
      '/api/v1/countries/:countryId',
      async (req: Request, res: Response) => {
        return 'GET PARAM countries ' + req.params?.countryId;
      }
    ).addMiddleware((req,res,next) => {
        console.log('request.params:', req.params);
        await next();
        console.log('final result:', res.statusCode);
    });

    let req = { url: '/api/v1/countries', method: 'GET' } as Request;
    let res = { ??? } as Response;
    let resolved = router.resolve(req);

    let compiled_route = router.getCompiledRoute(req,res);
    await compiled_route.run();
    console.log(res.statusCode);
```
