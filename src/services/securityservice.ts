import { SecurityCache } from "../cache/SecurityCache";
import { v4 as uuidv4 } from 'uuid';

export class SecurityService {
    public static async login(uid: string, pwd: string): Promise<string> {
        console.log("login called");
        if (uid=="admin" && pwd=="admin") {
            const uuid = uuidv4();
            SecurityCache.put('logintoken.'+uuid, "uid");
            return uuid;
        }
        throw new Error("Invalid Credentials");
    }
}