import { Blueprint } from "@devbro/pashmak/sql";
import { Migration } from "@devbro/pashmak/sql";
import { Schema } from "@devbro/pashmak/sql";

export default class CreateQuestionnaires extends Migration {
  async up(schema: Schema) {
    // Create questionnaires table
    await schema.createTable("questionnaires", (blueprint: Blueprint) => {
      blueprint.id();
      blueprint.timestamps();
      blueprint.string("title").nullable(false);
      blueprint.text("description").nullable();
      blueprint
        .enum("status", ["draft", "active", "inactive", "archived"])
        .default("draft");
      blueprint.json("settings").nullable(); // For storing form settings, display options, etc.
      blueprint.dateTime("published_at").nullable();
      blueprint.dateTime("expires_at").nullable();
      blueprint.boolean("is_anonymous").default(false);
      blueprint.boolean("allow_multiple_submissions").default(false);
      blueprint.integer("max_submissions").nullable();
      blueprint.string("created_by").nullable(); // User ID or identifier
      blueprint.string("slug").nullable().unique(); // For public URLs
    });

    // Create questionnaire_questions table
    await schema.createTable(
      "questionnaire_questions",
      (blueprint: Blueprint) => {
        blueprint.id();
        blueprint.timestamps();
        blueprint
          .integer("questionnaire_id")
          .references("id")
          .on("questionnaires")
          .onDelete("cascade");
        blueprint.string("title").nullable(false);
        blueprint.text("description").nullable();
        blueprint
          .enum("type", [
            "text",
            "textarea",
            "email",
            "number",
            "radio",
            "checkbox",
            "select",
            "multi_select",
            "date",
            "datetime",
            "file_upload",
            "rating",
            "likert_scale",
            "yes_no",
          ])
          .nullable(false);
        blueprint.json("options").nullable(); // For radio, checkbox, select options
        blueprint.json("validation").nullable(); // Validation rules
        blueprint.json("settings").nullable(); // Question-specific settings
        blueprint.boolean("is_required").default(false);
        blueprint.integer("sort_order").default(0);
        blueprint.boolean("is_active").default(true);
      },
    );

    // Create questionnaire_responses table
    await schema.createTable(
      "questionnaire_responses",
      (blueprint: Blueprint) => {
        blueprint.id();
        blueprint.timestamps();
        blueprint
          .integer("questionnaire_id")
          .references("id")
          .on("questionnaires")
          .onDelete("cascade");
        blueprint.string("respondent_id").nullable(); // For tracking anonymous/identified users
        blueprint.string("session_id").nullable(); // For anonymous tracking
        blueprint
          .enum("status", ["draft", "completed", "abandoned"])
          .default("draft");
        blueprint.dateTime("submitted_at").nullable();
        blueprint.json("metadata").nullable(); // IP, user agent, etc.
        blueprint.text("notes").nullable();
      },
    );

    // Create questionnaire_answers table
    await schema.createTable(
      "questionnaire_answers",
      (blueprint: Blueprint) => {
        blueprint.id();
        blueprint.timestamps();
        blueprint
          .integer("response_id")
          .references("id")
          .on("questionnaire_responses")
          .onDelete("cascade");
        blueprint
          .integer("question_id")
          .references("id")
          .on("questionnaire_questions")
          .onDelete("cascade");
        blueprint.text("answer_text").nullable(); // For text-based answers
        blueprint.json("answer_data").nullable(); // For complex answers (arrays, objects)
        blueprint.decimal("answer_numeric", 10, 2).nullable(); // For numeric answers
        blueprint.dateTime("answer_datetime").nullable(); // For date/datetime answers
        blueprint.boolean("answer_boolean").nullable(); // For yes/no, boolean answers
      },
    );

    // Create indexes for better performance
    await schema.table("questionnaire_questions", (blueprint: Blueprint) => {
      blueprint.index(["questionnaire_id", "sort_order"]);
      blueprint.index(["questionnaire_id", "is_active"]);
    });

    await schema.table("questionnaire_responses", (blueprint: Blueprint) => {
      blueprint.index(["questionnaire_id", "status"]);
      blueprint.index(["questionnaire_id", "submitted_at"]);
      blueprint.index(["respondent_id"]);
    });

    await schema.table("questionnaire_answers", (blueprint: Blueprint) => {
      blueprint.index(["response_id"]);
      blueprint.index(["question_id"]);
      blueprint.index(["response_id", "question_id"]);
    });
  }

  async down(schema: Schema) {
    await schema.dropTable("questionnaire_answers");
    await schema.dropTable("questionnaire_responses");
    await schema.dropTable("questionnaire_questions");
    await schema.dropTable("questionnaires");
  }
}
