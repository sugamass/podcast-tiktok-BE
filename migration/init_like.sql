CREATE TABLE likes (
    user_id VARCHAR NOT NULL,
    post_id VARCHAR NOT NULL,
    PRIMARY KEY (user_id, post_id)
);
