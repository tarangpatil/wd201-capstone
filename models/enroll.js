"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Enroll extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Enroll.belongsTo(models.User, { foreignKey: "userId" });
      Enroll.belongsTo(models.Course, { foreignKey: "courseId" });
    }
  }
  Enroll.init(
    {
      userId: DataTypes.INTEGER,
      courseId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Enroll",
    }
  );
  return Enroll;
};
