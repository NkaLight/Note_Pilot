-- PostgreSQL dumped from Supabase
-- Compatible with standard Postgres, prefix removed

-- Table: application_user
CREATE TABLE application_user (
    user_id integer NOT NULL,
    username character varying(20) NOT NULL,
    password text NOT NULL,
    email character varying(255) NOT NULL,
    date_of_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE SEQUENCE application_user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY application_user.user_id;

ALTER TABLE application_user
    ALTER COLUMN user_id SET DEFAULT nextval('application_user_user_id_seq'::regclass);

ALTER TABLE application_user
    ADD CONSTRAINT application_user_pkey PRIMARY KEY (user_id);

CREATE UNIQUE INDEX application_user_email_key ON application_user USING btree (email);
CREATE UNIQUE INDEX application_user_username_key ON application_user USING btree (username);


-- Table: chat_message
CREATE TABLE chat_message (
    message_id integer NOT NULL,
    upload_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE chat_message_message_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY chat_message.message_id;

ALTER TABLE chat_message
    ALTER COLUMN message_id SET DEFAULT nextval('chat_message_message_id_seq'::regclass);

ALTER TABLE chat_message
    ADD CONSTRAINT chat_message_pkey PRIMARY KEY (message_id);

CREATE INDEX chat_message_upload_id_user_id_idx ON chat_message USING btree (upload_id, user_id);


-- Table: flashcard
CREATE TABLE flashcard (
    flashcard_id integer NOT NULL,
    set_id integer NOT NULL,
    question_front text NOT NULL,
    answer_back text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    learnt boolean DEFAULT false
);

CREATE SEQUENCE flashcard_flashcard_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY flashcard.flashcard_id;

ALTER TABLE flashcard
    ALTER COLUMN flashcard_id SET DEFAULT nextval('flashcard_flashcard_id_seq'::regclass);

ALTER TABLE flashcard
    ADD CONSTRAINT flashcard_pkey PRIMARY KEY (flashcard_id);


-- Table: flashcard_set
CREATE TABLE flashcard_set (
    set_id integer NOT NULL,
    upload_id integer NOT NULL,
    text_data text NOT NULL
);

CREATE SEQUENCE flashcard_set_set_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY flashcard_set.set_id;

ALTER TABLE flashcard_set
    ALTER COLUMN set_id SET DEFAULT nextval('flashcard_set_set_id_seq'::regclass);

ALTER TABLE flashcard_set
    ADD CONSTRAINT flashcard_set_pkey PRIMARY KEY (set_id);

CREATE UNIQUE INDEX flashcard_set_upload_id_key ON flashcard_set USING btree (upload_id);


-- Table: glossary
CREATE TABLE glossary (
    glossary_id integer NOT NULL,
    upload_id integer NOT NULL,
    text_data text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE glossary_glossary_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY glossary.glossary_id;

ALTER TABLE glossary
    ALTER COLUMN glossary_id SET DEFAULT nextval('glossary_glossary_id_seq'::regclass);

ALTER TABLE glossary
    ADD CONSTRAINT glossary_pkey PRIMARY KEY (glossary_id);

CREATE UNIQUE INDEX glossary_upload_id_key ON glossary USING btree (upload_id);


-- Table: paper
CREATE TABLE paper (
    paper_id integer NOT NULL,
    user_id integer NOT NULL,
    started_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name text,
    code text,
    description text,
    filename text
);

CREATE SEQUENCE paper_paper_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY paper.paper_id;

ALTER TABLE paper
    ALTER COLUMN paper_id SET DEFAULT nextval('paper_paper_id_seq'::regclass);

ALTER TABLE paper
    ADD CONSTRAINT paper_pkey PRIMARY KEY (paper_id);


-- Table: preferences
CREATE TABLE preferences (
    user_id integer NOT NULL,
    learner_style character varying(50),
    dark_mode boolean DEFAULT false,
    language character varying(20)
);

ALTER TABLE preferences
    ADD CONSTRAINT preferences_pkey PRIMARY KEY (user_id);


-- Table: problem_set
CREATE TABLE problem_set (
    pset_id integer NOT NULL,
    upload_id integer NOT NULL,
    text_data text NOT NULL
);

CREATE SEQUENCE problem_set_pset_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY problem_set.pset_id;

ALTER TABLE problem_set
    ALTER COLUMN pset_id SET DEFAULT nextval('problem_set_pset_id_seq'::regclass);

ALTER TABLE problem_set
    ADD CONSTRAINT problem_set_pkey PRIMARY KEY (pset_id);

CREATE UNIQUE INDEX problem_set_upload_id_key ON problem_set USING btree (upload_id);


-- Table: problem
CREATE TABLE problem (
    problem_id integer NOT NULL,
    pset_id integer NOT NULL,
    question_text text NOT NULL,
    answer_text text
);

CREATE SEQUENCE problem_problem_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY problem.problem_id;

ALTER TABLE problem
    ALTER COLUMN problem_id SET DEFAULT nextval('problem_problem_id_seq'::regclass);

ALTER TABLE problem
    ADD CONSTRAINT problem_pkey PRIMARY KEY (problem_id);


-- Table: session
CREATE TABLE session (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    last_active_at timestamp without time zone,
    is_used boolean DEFAULT false
);

CREATE SEQUENCE session_session_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY session.session_id;

ALTER TABLE session
    ALTER COLUMN session_id SET DEFAULT nextval('session_session_id_seq'::regclass);

ALTER TABLE session
    ADD CONSTRAINT session_pkey PRIMARY KEY (session_id);

CREATE UNIQUE INDEX tokensunique ON session USING btree (token);


-- Table: study_guide
CREATE TABLE study_guide (
    id integer NOT NULL,
    paper_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    ai_level character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone NOT NULL
);

CREATE SEQUENCE study_guide_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY study_guide.id;

ALTER TABLE study_guide
    ALTER COLUMN id SET DEFAULT nextval('study_guide_id_seq'::regclass);

ALTER TABLE study_guide
    ADD CONSTRAINT study_guide_pkey PRIMARY KEY (id);

CREATE INDEX study_guide_paper_id_ai_level_idx ON study_guide USING btree (paper_id, ai_level);


-- Table: summary
CREATE TABLE summary (
    summary_id integer NOT NULL,
    upload_id integer NOT NULL,
    text_data text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE summary_summary_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY summary.summary_id;

ALTER TABLE summary
    ALTER COLUMN summary_id SET DEFAULT nextval('summary_summary_id_seq'::regclass);

ALTER TABLE summary
    ADD CONSTRAINT summary_pkey PRIMARY KEY (summary_id);

CREATE UNIQUE INDEX summary_upload_id_key ON summary USING btree (upload_id);


-- Table: term
CREATE TABLE term (
    term_id integer NOT NULL,
    glossary_id integer NOT NULL,
    term_data text NOT NULL
);

CREATE SEQUENCE term_term_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY term.term_id;

ALTER TABLE term
    ALTER COLUMN term_id SET DEFAULT nextval('term_term_id_seq'::regclass);

ALTER TABLE term
    ADD CONSTRAINT term_pkey PRIMARY KEY (term_id);


-- Table: upload
CREATE TABLE upload (
    upload_id integer NOT NULL,
    paper_id integer NOT NULL,
    filename text NOT NULL,
    storage_path text NOT NULL,
    file_type text,
    text_content text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE upload_upload_id_seq
    START WITH 1
    INCREMENT BY 1
    OWNED BY upload.upload_id;

ALTER TABLE upload
    ALTER COLUMN upload_id SET DEFAULT nextval('upload_upload_id_seq'::regclass);

ALTER TABLE upload
    ADD CONSTRAINT upload_pkey PRIMARY KEY (upload_id);


-- FOREIGN KEYS
ALTER TABLE chat_message
    ADD CONSTRAINT chat_message_user_id_fkey FOREIGN KEY (user_id) REFERENCES application_user(user_id) ON DELETE CASCADE;

ALTER TABLE chat_message
    ADD CONSTRAINT chat_message_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES upload(upload_id) ON DELETE CASCADE;

ALTER TABLE flashcard
    ADD CONSTRAINT flashcard_set_id_fkey FOREIGN KEY (set_id) REFERENCES flashcard_set(set_id) ON DELETE CASCADE;

ALTER TABLE flashcard_set
    ADD CONSTRAINT flashcard_set_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES upload(upload_id) ON DELETE CASCADE;

ALTER TABLE glossary
    ADD CONSTRAINT glossary_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES upload(upload_id) ON DELETE CASCADE;

ALTER TABLE paper
    ADD CONSTRAINT paper_user_id_fkey FOREIGN KEY (user_id) REFERENCES application_user(user_id) ON DELETE CASCADE;

ALTER TABLE preferences
    ADD CONSTRAINT preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES application_user(user_id) ON DELETE CASCADE;

ALTER TABLE problem
    ADD CONSTRAINT problem_pset_id_fkey FOREIGN KEY (pset_id) REFERENCES problem_set(pset_id) ON DELETE CASCADE;

ALTER TABLE problem_set
    ADD CONSTRAINT problem_set_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES upload(upload_id) ON DELETE CASCADE;

ALTER TABLE session
    ADD CONSTRAINT session_user_id_fkey FOREIGN KEY (user_id) REFERENCES application_user(user_id) ON DELETE CASCADE;

ALTER TABLE study_guide
    ADD CONSTRAINT study_guide_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES paper(paper_id) ON DELETE CASCADE;

ALTER TABLE summary
    ADD CONSTRAINT summary_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES upload(upload_id) ON DELETE CASCADE;

ALTER TABLE term
    ADD CONSTRAINT term_glossary_id_fkey FOREIGN KEY (glossary_id) REFERENCES glossary(glossary_id) ON DELETE CASCADE;

ALTER TABLE upload
    ADD CONSTRAINT upload_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES paper(paper_id) ON DELETE CASCADE;
