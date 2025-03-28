// types.ts
export interface InventoryGroup {
  name: string; // Added name field for array-based structure
  hosts: InventoryHost[];
  vars?: {
    become_secret_name?: string;
    connect_secret_name?: string;
  };
}

export interface InventoryHost {
  name: string;
}

export interface AnsibleInventory {
  groups: InventoryGroup[]; // Changed to array of groups
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  inventory?: T;
  group?: InventoryGroup;
  details?: {
    group: string;
    hostname: string;
  };
}
