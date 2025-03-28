// models/Result.ts
import { Model, DataTypes, CreationOptional } from "sequelize";
import sequelize from "../db/config";
import { Host } from "./Host";
import { Group } from "./Group";
import { Variables } from "./Variables";

/**
 * Result model for storing operation outcomes
 * Tracks execution results for operations performed on Hosts
 */
export class Result extends Model {
  public id!: number;
  public name!: string;
  public status!: string;
  public time!: Date;
  public host_id!: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date | null>;
}

Result.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    executed_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Result",
    paranoid: true,
    timestamps: true,
    underscored: true,
  }
);

Group.hasMany(Host, { 
  foreignKey: 'group_id', 
  as: 'hosts' 
});
Host.belongsTo(Group, { 
  foreignKey: 'group_id' 
});

Group.hasMany(Variables, { 
  foreignKey: 'group_id', 
  as: 'variables' 
});
Variables.belongsTo(Group, { 
  foreignKey: 'group_id' 
});

Host.hasMany(Result, { 
  foreignKey: 'host_id', 
  as: 'results' 
});
Result.belongsTo(Host, { 
  foreignKey: 'host_id' 
});
