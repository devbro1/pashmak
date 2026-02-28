import { describe, expect, test, beforeEach } from 'vitest';
import { Config } from '@/index.ts';

describe('Config class special features', () =>
{

    test('functional values', async () =>
    {
        let tval = 100;
        let c = new Config();
        await c.load({
            'v1': () => tval++,
            'v2': 200
        });

        expect(c.get('v2')).toBe(200);
        //functional values should be re-evaluated on each access
        expect(c.get('v1')).toBe(100);
        expect(c.get('v1')).toBe(101);
        expect(c.get('v1')).toBe(102);
    });

    test('promise values', async () =>
    {
        let count = 0;
        let envVars = {
            'v1': Promise.resolve(100),
            'v2': 200,
            'v3': new Promise((resolve) => setTimeout(() => {count++; resolve(300)}, 100))
        };
        let c = new Config();
        await c.load(envVars);

        //promises must be resolved only once
        expect(count).toBe(1);

        expect(c.get('v2')).toBe(200);
        expect(c.get('v1')).toBe(100);
        expect(c.get('v1')).toBe(100);
        expect(c.get('v1')).toBe(100);
        expect(c.get('v3')).toBe(300);
        expect(c.get('v3')).toBe(300);
        expect(c.get('v3')).toBe(300);
        expect(count).toBe(1);
    });


    test('env references', async () =>
    {
        let envVars = {
            'v1': 100,
            'v2': 200,
            'v3': {
                'v4': 400,
                'v5': 500
            },
            '$stage1': {
                'v2': 300,
                'v3': {
                    'v4': 350
                }
            },
            '$prod': {
                'v1': 400,
                'v3': {
                    'v5': 450
                }
            }
        };
        let c = new Config({});
        await c.load(envVars);

        expect(c.get('v1')).toBe(100);
        expect(c.get('v2')).toBe(200);
        expect(c.get('v3.v4')).toBe(400);
        expect(c.get('v3.v5')).toBe(500);

        c = new Config({ env: 'stage1' });
        await c.load(envVars);

        expect(c.get('v1')).toBe(100);
        expect(c.get('v2')).toBe(300);
        expect(c.get('v3.v4')).toBe(350);
        expect(c.get('v3.v5')).toBe(500);

        c = new Config({ env: 'prod' });
        await c.load(envVars);

        expect(c.get('v1')).toBe(400);
        expect(c.get('v2')).toBe(200);
        expect(c.get('v3.v4')).toBe(400);
        expect(c.get('v3.v5')).toBe(450);
    });

});
