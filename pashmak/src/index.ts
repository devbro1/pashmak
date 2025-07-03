import dotenv from "dotenv";
import { context_provider } from "neko-helper";
import { Middleware } from "neko-router";
import { runNext } from "neko-helper";
import { Request, Response } from "neko-router";
import { config } from "neko-config";

export { config };
export async function bootstrap(options: { root_dir: string }): Promise<void> {
    // This function is used to bootstrap the application.
    // It can be used to initialize the application, load configuration, etc.
    // Currently, it does nothing but can be extended in the future.
    dotenv.config();

    console.log("Bootstrapping application...");
    console.log(`Root directory: ${options.root_dir}`);
    let a = (await import(`${options.root_dir}/config/default`)).default;
    config.load(a);

    console.log("Loading application modules...");
    await import(`./app/console`);
    console.log("Loading Database Provider ...");
    const { DatabaseServiceProvider } = await import("./DatabaseServiceProvider");

    console.log("Registering service providers...");
    await import(`${options.root_dir}/app/console`);
    await import(`${options.root_dir}/routes`);
    await import(`${options.root_dir}/schedules`);

    console.log("Setting up pre-loader for context provider...");
    context_provider.setPreLoader(async (f: Function) => {
        const middlewares: Middleware[] = [];
        // do I need to use ServiceProvider like a middleware or can I get rid of this logic?
        middlewares.push(DatabaseServiceProvider.getInstance());

        return await runNext(
            middlewares,
            {} as Request,
            {} as Response,
            // @ts-ignore
            f,
        );
    });
    console.log("Application bootstrapped successfully.");
}

