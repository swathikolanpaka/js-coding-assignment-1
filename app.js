const express = require("express");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Object format changing
const changeObjectFormat = (eachObject) => {
  return {
    id: eachObject.id,
    todo: eachObject.todo,
    priority: eachObject.priority,
    status: eachObject.status,
    category: eachObject.category,
    dueDate: eachObject.due_date,
  };
};
const checkStatus = (status) => {
  return status === "TO DO" || status === "DONE" || status === "IN PROGRESS";
};
const checkPriority = (priority) => {
  return priority === "LOW" || priority === "HIGH" || priority === "MEDIUM";
};
const checkStatusAndPriority = (priority, status) => {
  return checkStatus(path) && checkPriority(status);
};
const checkCategory = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};

//1 API
app.get("/todos/", async (request, response) => {
  let { status, priority, search_q, category } = request.query;

  let todoQuery = "";

  switch (true) {
    //3
    case status !== undefined && priority !== undefined:
      console.log(priority, status);
      console.log(checkPriority(priority) && checkStatus(status));
      if (checkPriority(priority) && checkStatus(status)) {
        todoQuery = `SELECT * FROM todo WHERE priority LIKE "%${priority}%" AND
         status LIKE "%${status}%";`;
        todoArray = await db.all(todoQuery);
        todoArray = todoArray.map((eachObject) =>
          changeObjectFormat(eachObject)
        );
        console.log(todoQuery);

        response.send(todoArray);
      } else if (checkPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    //4
    case search_q !== undefined:
      todoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      todoArray = await db.all(todoQuery);
      todoArray = todoArray.map((eachObject) => changeObjectFormat(eachObject));
      response.send(todoArray);
      break;
    //7
    case (category !== undefined) & (priority !== undefined):
      console.log(checkCategory(category) && checkPriority(priority));
      if (checkCategory(category) && checkStatus(priority)) {
        todoQuery = `SELECT * FROM todo WHERE category LIKE "${category}" AND priority LIKE "${priority}";`;
        todoArray = await db.all(todoQuery);
        todoArray = todoArray.map((eachObject) =>
          changeObjectFormat(eachObject)
        );
        response.send(todoArray);
      } else if (checkCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    //5
    case (category !== undefined) & (status !== undefined):
      if (checkCategory(category) && checkStatus(status)) {
        todoQuery = `SELECT * FROM todo WHERE category LIKE "%${category}%" AND status LIKE "%${status}%";`;
        todoArray = await db.all(todoQuery);
        todoArray = todoArray.map((eachObject) =>
          changeObjectFormat(eachObject)
        );
        response.send(todoArray);
      } else if (checkCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    //1
    case status !== undefined:
      if (checkStatus(status)) {
        todoQuery = `SELECT *  FROM todo WHERE status LIKE "%${status}%";`;
        todoArray = await db.all(todoQuery);
        todoArray = todoArray.map((eachObject) =>
          changeObjectFormat(eachObject)
        );
        response.send(todoArray);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //2
    case priority !== undefined:
      if (checkPriority(priority)) {
        todoQuery = `SELECT * FROM todo WHERE priority LIKE "%${priority}%";`;
        todoArray = await db.all(todoQuery);
        todoArray = todoArray.map((eachObject) =>
          changeObjectFormat(eachObject)
        );
        response.send(todoArray);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //6
    case category !== undefined:
      console.log(checkCategory(category));
      if (checkCategory(category)) {
        todoQuery = `SELECT * FROM todo WHERE category LIKE "%${category}%";`;
        todoArray = await db.all(todoQuery);
        todoArray = todoArray.map((eachObject) =>
          changeObjectFormat(eachObject)
        );
        response.send(todoArray);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      todoQuery = `SELECT * FROM todo;`;
      todoArray = await db.all(todoQuery);
      todoArray = todoArray.map((eachObject) => changeObjectFormat(eachObject));
      response.send(todoArray);
  }
});

//2 api
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  // console.log(todoId)
  let todoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  let todoArray = await db.get(todoQuery);
  const objectFormat = (eachObject) => {
    return {
      id: eachObject.id,
      todo: eachObject.todo,
      priority: eachObject.priority,
      status: eachObject.status,
      category: eachObject.category,
      dueDate: eachObject.due_date,
    };
  };

  response.send(objectFormat(todoArray));
});

//3 API
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  // console.log(date);
  let newDateFormat = format(new Date(date), "yyyy-MM-dd");
  console.log(newDateFormat);
  if (isValid(newDateFormat)) {
    const dateQuery = `SELECT * FROM todo WHERE due_date=${newDateFormat};`;
    console.log(dateQuery);
    const dateArray = await db.all(dateQuery);
    dateResultArray = dateArray.map((eachObject) =>
      changeObjectFormat(dateArray)
    );
    response.send(dateResultArray);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//4 api
app.post("/todos/", async (request, response) => {
  let todoDetails = request.body;
  let { id, todo = "", priority, status, category, dueDate } = todoDetails;
  if (
    status !== undefined &&
    checkStatus(status) &&
    category !== undefined &&
    checkCategory(category) &&
    priority !== undefined &&
    checkPriority(priority)
  ) {
    const todoQuery = `INSERT INTO todo
    (id,todo,category,priority,status,due_date)
    VALUES
    (
    ${id},
    "${todo}",
    "${category}",
    "${priority}",
    "${status}",
    "${dueDate}");`;
    await db.run(todoQuery);
    //console.log(todoDetails);
    response.send("Todo Successfully Added");
  } else if (checkCategory(category) && category !== undefined) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (checkPriority(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//5 api
app.put("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let { status, priority, todo, category, dueDate } = request.body;
  let updatedQuery = "";

  switch (true) {
    //1 Scenario
    case status !== undefined:
      if (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") {
        updatedQuery = `UPDATE todo SET status="${status}" WHERE id=${todoId};`;
        console.log(updatedQuery);
        await db.run(updatedQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    //2 Scenario
    case priority !== undefined:
      if (priority === "LOW" || priority === "HIGH" || priority === "MEDIUM") {
        updatedQuery = `UPDATE todo SET priority="${priority}" WHERE id=${todoId};`;
        await db.run(updatedQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //3 Scenario
    case todo !== undefined:
      updatedQuery = `UPDATE todo SET todo="${todo}" WHERE id=${todoId};`;

      await db.run(updatedQuery);
      response.send("Todo Updated");
      break;
    //4 Scenario
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updatedQuery = `UPDATE todo SET category="${category}" WHERE id=${todoId};`;
        await db.run(updatedQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //5 Scenario
    case dueDate !== undefined:
      //console.log(dueDate);

      if (dueDate !== undefined) {
        updatedQuery = `UPDATE todo SET due_date="${dueDate}" WHERE id=${todoId};`;
        await db.run(updatedQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    default:
      updatedQuery = `SELECT * FROM todo WHERE id=${todoId};`;
      await db.run(updatedQuery);
  }
});

//6 API delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  const update = await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
