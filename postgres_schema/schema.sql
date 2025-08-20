-- DUMP THIS FILE INTO YOUR SCHEMA ON THE UNIVERSITY'S POSTGRES SERVER
DROP TABLE IF EXISTS flashcard CASCADE;
DROP TABLE IF EXISTS flashcard_set CASCADE;
DROP TABLE IF EXISTS problem CASCADE;
DROP TABLE IF EXISTS problem_set CASCADE;
DROP TABLE IF EXISTS term CASCADE;
DROP TABLE IF EXISTS glossary CASCADE;
DROP TABLE IF EXISTS summary CASCADE;
DROP TABLE IF EXISTS upload CASCADE;
DROP TABLE IF EXISTS paper CASCADE;
DROP TABLE IF EXISTS preferences CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS twofactorauthtoken CASCADE;
DROP TABLE IF EXISTS application_user CASCADE;


-- User 
CREATE TABLE application_user (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE ,
    password TEXT NOT NULL,
    --password_hash TEXT NOT NULL,             uncomment when working
    email varchar(255) UNIQUE NOT NULL,
    date_of_creation TIMESTAMP DEFAULT NOW()
);

-- Paper
CREATE TABLE paper(
    paper_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES application_user(user_id) ON DELETE CASCADE,
    filename varchar(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Upload
CREATE TABLE upload (
    upload_id SERIAL PRIMARY KEY,
    paper_id INT NOT NULL REFERENCES paper(paper_id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    
    UNIQUE (paper_id, filename)
);

-- Two-Factor Auth Token
CREATE TABLE twofactorauthtoken (
    token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES application_user(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Session
CREATE TABLE session (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES application_user(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_active_at TIMESTAMP,
    is_used BOOLEAN DEFAULT FALSE
);
-- User preferences
CREATE TABLE preferences (
    user_id INT PRIMARY KEY REFERENCES application_user(user_id) ON DELETE CASCADE,
    learner_style VARCHAR(50) CHECK (learner_style IN ('early', 'intermediate', 'advanced')),
    dark_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(20)
);

-- Summary
CREATE TABLE summary (
    summary_id SERIAL PRIMARY KEY,
    upload_id INT UNIQUE NOT NULL REFERENCES upload(upload_id) ON DELETE CASCADE,
    text_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Glossary
CREATE TABLE glossary (
    glossary_id SERIAL PRIMARY KEY,
    upload_id INT UNIQUE NOT NULL REFERENCES upload(upload_id) ON DELETE CASCADE,
    text_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Term
CREATE TABLE term (
    term_id SERIAL PRIMARY KEY,
    glossary_id INT NOT NULL REFERENCES glossary(glossary_id) ON DELETE CASCADE,
    term_data TEXT NOT NULL
);



-- Flashcard set
CREATE TABLE flashcard_set (
    set_id SERIAL PRIMARY KEY,
    upload_id INT UNIQUE NOT NULL REFERENCES upload(upload_id) ON DELETE CASCADE,
    text_data TEXT NOT NULL
);


-- Flashcard
CREATE TABLE flashcard (
    flashcard_id SERIAL PRIMARY KEY,
    set_id INT NOT NULL REFERENCES flashcard_set(set_id) ON DELETE CASCADE,
    question_front TEXT NOT NULL,
    answer_back TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    learnt BOOLEAN DEFAULT FALSE
);

-- Problem set
CREATE TABLE problem_set (
    pset_id SERIAL PRIMARY KEY,
    upload_id INT UNIQUE NOT NULL REFERENCES upload(upload_id) ON DELETE CASCADE,
    text_data TEXT NOT NULL
);

-- Problem 
CREATE TABLE problem (
    problem_id SERIAL PRIMARY KEY,
    pset_id INT NOT NULL REFERENCES problem_set(pset_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT
);


