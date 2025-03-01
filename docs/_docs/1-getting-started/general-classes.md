---
title: Basic code
category: Classes
order: 4
---

The classes that are provided by the library are:
- Query: The main class that represents a query as a JS object. to be used for selecting, inserting, updating, and deleting data.
- QueryGrammar: The base class used for converting a query object to a SQL string.
- Schema: The class that represents a schema as a JS object. to be used for creating and dropping tables, and creating and dropping indexes.
- SchemaGrammar: The class that converts a schema object to a SQL string.
- Connection: The base class that represents a connection to a database. This class will be extended by the database-specific connection classes.
- Blueprint: A representor of a table schema. It is used to create, alter, and drop tables.
- Column: A representor of a column in a table schema.

The classes that are specific to Postgresql are:
- PostgresqlQueryGrammar: The class that extends QueryGrammar and is used for converting a query object to a Postgresql SQL string.
- PostgresqlSchemaGrammar: The class that extends SchemaGrammar and is used for converting a schema object to a Postgresql SQL string.
- PostgresqlConnection: The class that extends Connection and is used for connecting to a Postgresql database.
