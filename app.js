const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializationDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error is ${e.message}`);
    process.exit(1);
  }
};

initializationDbAndServer();
const convertSnakeCaseToCamelCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//get todos
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;

  let getTodoQuery;
  if (status !== undefined) {
    const getStatusQuery = `
        SELECT 
          * 
        FROM 
          todo 
        WHERE 
           status='${status}';`;
    getTodoQuery = getStatusQuery;
  } else if (priority !== undefined) {
    const getPriorityQuery = `
        SELECT 
          * 
        FROM 
          todo 
        WHERE 
           priority='${priority}';`;
    getTodoQuery = getPriorityQuery;
  } else if (status !== undefined && priority !== undefined) {
    const getQuery = `
          SELECT 
            *
          FROM
           todo 
          WHERE 
            status='${status}'
            AND priority='${priority}';`;
    getTodoQuery = getQuery;
  } else if (status !== undefined && category !== undefined) {
    const getQuery = `
        SELECT 
          *
        FROM 
          todo 
        WHERE 
         status='${status}'
         AND category='${category}'`;
    getTodoQuery = getQuery;
  } else if (category !== undefined) {
    const getQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE 
         category='${category}';`;
    getTodoQuery = getQuery;
  } else if (category !== undefined && priority !== undefined) {
    const getQuery = ` 
        SELECT 
          * 
        FROM 
         todo 
        WHERE 
          category='${category}'
          AND priority='${priority}';`;
    getTodoQuery = getQuery;
  } else if (search_q !== undefined) {
    const getSearchQuery = `
        SELECT 
          *
        FROM 
          todo 
        WHERE 
          todo LIKE '%${search_q}%'`;
    getTodoQuery = getSearchQuery;
  } else if (status === undefined) {
    response.status(400);
    response.send("Invalid Status");
  }
  const todosArray = await db.all(getTodoQuery);
  response.send(
    todosArray.map((eachObj) => convertSnakeCaseToCamelCase(eachObj))
  );
});

// get specific todos
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
      SELECT 
        * 
      FROM 
       todo 
      WHERE 
       id=${todoId};`;
  const data = await db.get(getTodoQuery);
  response.send(data);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateFormat = new Date(date);

  const getQuery = `
    SELECT 
      * 
    FROM 
      todo
    WHERE 
      CAST(strftime('%Y',due_date) as INTEGER)=${dateFormat.getFullYear()}
      AND CAST(strftime('%m',due_date) as INTEGER)=${dateFormat.getMonth() + 1}
      AND CAST(strftime('%d',due_date) as INTEGER)=${dateFormat.getDate()};`;
  const data = await db.all(getQuery);
  response.send(convertSnakeCaseToCamelCase(data));
});

// add todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const createTodoQuery = `
    INSERT INTO 
      todo (id,todo,priority,status,category,due_date)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    )`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

// update todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;

  if (status !== undefined) {
    const updateQuery = `
    UPDATE 
      todo
    SET 
       status='${status}'
    WHERE 
       id=${todoId}`;
    await db.run(updateQuery);
    response.send("Status Updated");
  } else if (priority !== undefined) {
    const updateQuery = `
    UPDATE 
      todo
    SET 
       priority='${priority}'
    WHERE 
       id=${todoId}`;
    await db.run(updateQuery);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    const updateQuery = `
    UPDATE 
      todo
    SET 
       todo='${todo}'
    WHERE 
       id=${todoId}`;
    await db.run(updateQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    const updateQuery = `
    UPDATE 
      todo
    SET 
       category='${category}'
    WHERE 
       id=${todoId}`;
    await db.run(updateQuery);
    response.send("Category Updated");
  } else if (dueDate !== undefined) {
    const updateQuery = `
    UPDATE 
      todo
    SET 
       due_date='${dueDate}'
    WHERE 
       id=${todoId}`;
    await db.run(updateQuery);
    response.send("Due Date Updated");
  }
});

//delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
       DELETE FROM
         todo 
       WHERE 
          id=${todoId};`;
  await db.get(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
