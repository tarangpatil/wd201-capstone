"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MarkComplete extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MarkComplete.belongsTo(models.User, { foreignKey: "userId" });
      MarkComplete.belongsTo(models.Page, { foreignKey: "pageId" });
    }
  }
  MarkComplete.init(
    {
      userId: DataTypes.INTEGER,
      pageId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "MarkComplete",
    }
  );
  return MarkComplete;
};
