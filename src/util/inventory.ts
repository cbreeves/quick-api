import * as fs from "fs";
import * as readline from "node:readline";

class InventoryHost {
  name: string = "";
  vars: any = {};
  constructor(name: string, vars: any) {
    this.name = name;
    this.vars = vars;
  }
}

class InventoryGroup {
  name: string = "";
  hosts: InventoryHost[] = [];
  constructor(name: string) {
    this.name = name;
  }

  addHost(newHost: string) {
    if (this.hosts == undefined) {
      this.hosts = [];
    };
    if(this.hosts.findIndex((host: InventoryHost) => host.name==newHost) == -1)
    {
        this.hosts.push(new InventoryHost(newHost, {}));
    }
  }
}

enum ParseResult {
  OPEN_BRACK,
  CLOSE_BRACK,
  COLON,
  EQUAL,
  STRING,
  EOL,
  EOF,
}

class INIParseToken {
  token!: ParseResult;
  value: any;
}

export class Inventory {
  write() {
    let output = "";
    this.groups.forEach((group: InventoryGroup) => {
      output += `[${group.name}]\n`;
      group.hosts.forEach((host: InventoryHost) => {
        output += `${host.name}\n`;
      });
      output += "\n";
    });
    fs.writeFileSync(this.inventory_path, output);
  }
  getGroupByName(groupName: any): InventoryGroup | undefined {
    return this.groups.find((group: InventoryGroup) => group.name == groupName);
  }
  inventory_path: string;
  freeHosts: InventoryHost[] = [];
  groups: InventoryGroup[]=[];

  constructor(inventory_path: string) {
    this.inventory_path = inventory_path;
  }

  async readFile() {
    const fileStream = fs.createReadStream(this.inventory_path);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    await this.parseLine(rl);
  }

  async parseLine(rl: any): Promise<INIParseToken[]> {
    let tokens: INIParseToken[] = [];
    for await (const line of rl) {
      tokens = [...tokens, ...this.lex(line)];
    }
    tokens.push({ token: ParseResult.EOF, value: "EOF" })
    this.groups = this.parseINIFile(tokens);
    return tokens;
  }

  parseINIFile(tokens: INIParseToken[]): any {
    this.freeHosts=[...this.parseHosts(tokens)];
    console.log(this.freeHosts);
    this.groups=[...this.parseSections(tokens)];
    console.log(JSON.stringify(this.groups));
    return this.groups;
  }

  parseSections(tokens: INIParseToken[]): InventoryGroup[] {
    var groups: InventoryGroup[] = [];
    var grp: InventoryGroup;
    if (tokens.length == 0) {return []}
    if (tokens[0].token != ParseResult.OPEN_BRACK) {return []}
    else if (tokens[0].token == ParseResult.OPEN_BRACK) {
      grp = new InventoryGroup(tokens[1].value);
      groups.push(grp);
      if(tokens[2].token == ParseResult.CLOSE_BRACK) {
         grp.hosts = this.parseHosts(tokens.splice(3));
      }
    } else {
      throw new Error("Invalid token: " + tokens[0].value);
    }
    return groups;
  }

  parseHosts(tokens: INIParseToken[]): InventoryHost[] {

    var freeHosts: InventoryHost[] = [];
    if (tokens.length == 0) {return []}
    if (tokens[0].token == ParseResult.OPEN_BRACK) {return []}
    if (tokens[0].token == ParseResult.EOL) { return this.parseHosts(tokens.splice(1)); }
    if (tokens[0].token == ParseResult.EOF) { return this.parseHosts(tokens.splice(1)); }
    else if (tokens[0].token == ParseResult.STRING) {
      freeHosts.push(new InventoryHost(tokens[0].value, {}));
      if(tokens[1].token == ParseResult.EOL) {
        return [...freeHosts, ...this.parseHosts(tokens.splice(2))];
      }
    } else {
      throw new Error("Invalid token: " + tokens[0].value);
    }
    return [];
  }

  parseFreeHosts(tokens: INIParseToken[]) {
    throw new Error("Function not implemented.");
  }

  lex(line: any): INIParseToken[] {
    if (line.length == 0) return [{ token: ParseResult.EOL, value: "EOL" }];
    if (line.charAt(0) == "[") {
      return [{ token: ParseResult.OPEN_BRACK, value: "[" }, ...this.lex(line.substring(1))];
    } else if (line.charAt(0) == "]") {
      return [{ token: ParseResult.CLOSE_BRACK, value: "]" }, ...this.lex(line.substring(1))];
    } else if (line.charAt(0) == ":") {
      return [{ token: ParseResult.COLON, value: ":" }, ...this.lex(line.substring(1))];
    } else if (line.charAt(0) == "=") {
      return [{ token: ParseResult.EQUAL, value: "=" }, ...this.lex(line.substring(1))];
    } else if (line.charAt(0) == "\n") {
      return [];
    } else if (line.charAt(0) == " ") {
      return [...this.lex(line.substring(1))];
    } else {
      var i = 0;
      let c = line.charAt(i);
      let str: string = "";
      while (c != " " && c != "[" && c != "]" && c != ":" && c != "=" && c != "\n") {
        i++;
        str += c;
        c = line.charAt(i);
        if (i > line.length) {
          break;
        }
      }
      return [{ token: ParseResult.STRING, value: str }, ...this.lex(line.substring(i))];
    }
  }
}
