CREATE TABLE macros (
  user_id TEXT NOT NULL,
  macro_name TEXT NOT NULL,
  expression TEXT NOT NULL,
  PRIMARY KEY (user_id, macro_name)
);
