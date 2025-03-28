#!/usr/bin/env ts-node
import * as fs from "fs";
import * as path from "path";
import { exit } from "process";
import { SecretsManagerUtil } from "../../../src/util/secrets";

var secretsManager = new SecretsManagerUtil();

async function readJsonFile(filePath: string): Promise<any> {
  try {
    const absolutePath = path.resolve(__dirname, filePath);
    const data = await fs.promises.readFile(absolutePath, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    console.error(`Error reading or parsing JSON file: ${error.message}`);
    throw error;
  }
}

// Example usage:
async function main() {
  try {
    const jsonData = await readJsonFile("../../inventory");
    var g = jsonData.groups[0];
    var out = {} as any;
    out[g.name] = {
      hosts: g.hosts.map((h: any) => h.dnsHostname),
    };
    var vars: any = {};
    await secretsManager.getSecret(g.vars.become_secret_name).then((data) => {
      //console.log(data)
      vars.become_pass = data.password;
    });
    await secretsManager.getSecret(g.vars.become_secret_name).then((data) => {
      vars.ansible_ssh_user = data.username;
      vars.ansible_ssh_pass = data.password;
    });
    out[g.name].vars = vars;
    out["_meta"] = { hostvars: {} };
    console.log(JSON.stringify(out));
  } catch (error) {
    // Handle the error appropriately
  }
}

const args: string[] = process.argv.slice(2);

if (args.length === 0) {
  console.log("No arguments provided.");
  exit(0);
} else if (args[0] === "--list") {
  main();
}
else if (args[0] === "--host") {
 console.log( '{"_meta": {hostvars": {"myhost.domain.com": {"host_specific-test_var": "test-value"}}}}' )
}
