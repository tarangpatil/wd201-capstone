"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Course.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Course.belongsToMany(models.User, {
        through: models.Enroll,
        foreignKey: "courseId",
      });
      Course.hasMany(models.Chapter, {
        onDelete: "CASCADE",
        foreignKey: "courseId",
      });
    }
    static async deleteCourse(id) {
      try {
        const chapters = await sequelize.models.Chapter.findAll({
          where: {
            courseId: id,
          },
        });
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          await chapter.destroy();
        }
        const course = await this.findByPk(id);
        if (!course) {
          throw new Error("Course not found");
        }
        await course.destroy();
        return true;
      } catch (error) {
        console.log("Error deleting course:", error.message);
        return false;
      }
    }
  }
  Course.init(
    {
      name: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Course",
    }
  );
  return Course;
};
