import cacheMe from './cacheMe';
import { CachePointers } from '../lib/Enums';
import UserData from '../lib/structures/UserData';
import utils from '../lib/Utils';

export default class UsersManager {
  private static createUserData(id: string): UserData {
    const user = new UserData(id);
    cacheMe.set(id + CachePointers.user, user);
    return user;
  }

  public static getUserData(id: string): UserData {
    if (!utils.checkId(id)) throw new Error('Invalid id');

    return (
      (cacheMe.get(id + CachePointers.user) as UserData) ||
      this.createUserData(id)
    );
  }
}
