import { HttpBadRequestError, HttpForbiddenError } from '@devbro/pashmak/http';
import jwt from 'jsonwebtoken';
import { config } from '@devbro/pashmak/config';
import { BaseModel, RelationshipManagerMtoM } from '@devbro/pashmak/orm';
import { ctx } from '@devbro/pashmak/context';
import { logger } from '@devbro/pashmak/facades';

export function createJwtToken(data: any, token_params: jwt.SignOptions = {}) {
  const secret = config.get('jwt.secret') as string;
  const token_params2 = config.get('jwt.options') as jwt.SignOptions;
  const token = jwt.sign(data, secret, { ...token_params2, ...token_params });

  if (!token) {
    throw new Error('Unable to sign token !!');
  }
  return token;
}

export async function decodeJwtToken(token: string) {
  if (await jwt.verify(token, config.get('jwt.public'))) {
    return await jwt.decode(token);
  }

  if (await jwt.verify(token, config.get('jwt.public_retired'))) {
    return await jwt.decode(token);
  }

  throw new HttpBadRequestError('bad token. invalid, expired, or signed with wrong key.');
}

/**
 * create two lists of what is to add and what to remove to convert currentRelations to newRelations
 * @param currentRelations the base list
 * @param newRelations the target list
 * @param compare_method a method to compare two items, returns true if item is not in the list
 * @returns { toAdd: T[]; toRemove: T[] }
 */
export function diffLists<T extends BaseModel>(
  currentRelations: T[],
  newRelations: T[],
  compare_method: (item: T, list: T[]) => boolean = (item: T, list: T[]) => !list.some((c: T) => c.id === item.id)
): { toAdd: T[]; toRemove: T[] } {
  const toAdd = newRelations.filter((r: T) => compare_method(r, currentRelations));
  const toRemove = currentRelations.filter((r: T) => compare_method(r, newRelations));
  return { toAdd, toRemove };
}

export async function syncManyToMany<T1 extends BaseModel, T2 extends BaseModel>(
  rel_manager: RelationshipManagerMtoM<T1, T2>,
  currentRelations: T2[],
  newRelations: T2[]
) {
  const { toAdd, toRemove } = diffLists(currentRelations, newRelations);

  await rel_manager.dissociate(toRemove);
  await rel_manager.associate(toAdd);
}

export function getAuthenticatedUser(): {
  id: number;
  can: (permission: string) => boolean;
  canOrFail: (permissions: string) => boolean;
  getScope: (permission: string) => any;
} {
  return ctx().get('auth_user');
}

export type VarOrArray<T> = T | T[];

export function requirePermissions(required_permissions: VarOrArray<string>): MethodDecorator {
  return function (_target: any, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      let auth_user = getAuthenticatedUser();

      const permissionsArray = Array.isArray(required_permissions) ? required_permissions : [required_permissions];

      let user_can_any = false;
      for (let permission of permissionsArray) {
        if (auth_user.can(permission)) {
          user_can_any = true;
          break;
        }
      }
      if (!user_can_any) {
        logger().warn('Permission denied', {
          user_id: auth_user.id,
          required_permissions: permissionsArray,
        });
        throw new HttpForbiddenError();
      }
      return originalMethod.apply(this, args);
    };
  };
}
