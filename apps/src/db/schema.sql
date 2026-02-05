CREATE TABLE if not EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('creator', 'contestee')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE if not EXISTS contests(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE if not EXISTS mcq_questions(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE if not EXISTS dsa_problems(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags JSONB,
    points INTEGER NOT NULL DEFAULT 100,
    time_limit INTEGER NOT NULL DEFAULT 2000,
    memory_limit INTEGER NOT NULL DEFAULT 256,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE if not EXISTS test_cases(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES dsa_problems(id),
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE if not EXISTS mcq_submissions(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES mcq_questions(id),
    selected_option_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, question_id)
);

CREATE TABLE if not EXISTS dsa_submissions(
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    problem_id UUID NOT NULL REFERENCES dsa_problems(id),
    code TEXT NOT NULL,
    language TEXT,
    status TEXT,
    points_earned INTEGER NOT NULL DEFAULT 0,
    test_cases_passed INTEGER NOT NULL DEFAULT 0,
    total_test_cases INTEGER NOT NULL DEFAULT 0,
    execution_time INTEGER,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);