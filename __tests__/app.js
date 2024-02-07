const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCSRFToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCSRFToken(res);
  res = await agent.post("/login").send({
    email: username,
    password,
    _csrf: csrfToken,
  });
};

describe("Learning Management System", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up testing", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCSRFToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "Educator1",
      email: "te1@gmail.com",
      password: "educatorRocks",
      userType: "educator",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out test", async () => {
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a course", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    const res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCSRFToken(res);
    const response = await agent.post("/course").send({
      courseName: "C language",
      _csrf: csrfToken,
    });
    expect(response.text).toBe("Found. Redirecting to /dashboard/");
    expect(response.statusCode).toBe(302);
  });
  test("Deletes a course", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCSRFToken(res);
    res = await agent.delete("/course").send({
      courseId: 1,
      _csrf: csrfToken,
    });
    console.log(res.text);
    expect(res.text).toBe("Found. Redirecting to /dashboard");
    expect(res.statusCode).toBe(302);
  });
  test("Creates a chapter", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    let csrfToken = extractCSRFToken(res);
    res = await agent.post("/course").send({
      courseName: "C language",
      _csrf: csrfToken,
    });
    res = await agent.get("/courses/2/chapters/new");
    csrfToken = extractCSRFToken(res);
    res = await agent.post("/chapter").send({
      _csrf: csrfToken,
      courseId: 2,
      name: "Computers",
      description: "This chapter teaches how computer works from the inside",
    });
    expect(res.statusCode).toBe(302);
  });
  test("Deletes a chapter", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    let csrfToken = extractCSRFToken(res);
    res = await agent.delete("/chapter").send({
      _csrf: csrfToken,
      chapterId: 69,
    });
  });
  test("Creates a page", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    let csrfToken = extractCSRFToken(res);
    res = await agent.post("/chapter").send({
      _csrf: csrfToken,
      courseId: 2,
      name: "intro to something",
      description: "intro to the same thing",
    });
    console.log(res.text);
    expect(res.text).toBe("Found. Redirecting to /courses/2/");
    expect(res.statusCode).toBe(302);
  });
  test("Deletes a page", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
    let csrfToken = extractCSRFToken(res);
    res = await agent.delete("/chapter").send({
      _csrf: csrfToken,
      id: 1,
    });
    expect(res.text).toBe("Found. Redirecting to /courses/2");
    expect(res.statusCode).toBe(302);
  });
  test("Enrolls a user in a course", async () => {
    const agent = request.agent(server);
    let res = await agent.get("/signup");
    let csrfToken = extractCSRFToken(res);
    res = await agent.post("/users").send({
      _csrf: csrfToken,
      firstName: "Test",
      lastName: "Student1",
      email: "ts1@gmail.com",
      password: "studentRocks",
      userType: "student",
    });
    expect(res.statusCode).toBe(302);
    csrfToken = extractCSRFToken(await agent.get("/dashboard"));
    res = await agent.post("/enroll").send({ courseId: 2, _csrf: csrfToken });
    expect(res.text).toBe("Found. Redirecting to /dashboard");
    expect(res.statusCode).toBe(302);
  });
  test("Mark a page as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    let csrfToken = extractCSRFToken(await agent.get("/chapter/2/pages/new"));
    let res = await agent.post("/page").send({
      _csrf: csrfToken,
      name: "Why HTML?",
      content: "Because HTML makes webpage body",
      chapterId: 2,
    });
    await agent.get("/signout");
    await login(agent, "ts1@gmail.com", "studentRocks");
    res = await agent.get("/dashboard");
    csrfToken = extractCSRFToken(res);
    res = await agent.post("/markComplete").send({
      _csrf: csrfToken,
      id: 1,
    });
    console.log(res.text);
    expect(res.text.includes("/pages/1")).toBe(true);
    expect(res.statusCode).toBe(302);
  });
  test("Change user password", async () => {
    const agent = request.agent(server);
    await login(agent, "te1@gmail.com", "educatorRocks");
    const csrfToken = extractCSRFToken(await agent.get("/dashboard"));
    await agent.post("/changePassword").send({
      _csrf: csrfToken,
      oldPassword: "educatorRocks",
      newPassword: "educatorShocks",
      newRepassword: "educatorShocks",
    });
    await login(agent, "te1@gmail.com", "educatorShocks");
    let res = await agent.get("/dashboard");
    expect(res.statusCode).toBe(200);
  });
});
