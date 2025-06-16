-- Create posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER,
  author VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Insert sample posts
INSERT INTO posts (title, content) VALUES
('First Post', 'This is the content of the first post.'),
('Second Post', 'This is the content of the second post.'),
('Third Post', 'Here is the third post with some thoughts.'),
('Fourth Post', 'Insights and opinions in the fourth post.'),
('Fifth Post', 'The fifth post is all about conclusions.');

-- Insert sample comments
INSERT INTO comments (post_id, author, content) VALUES
(1, 'Alice', 'Great post!'),
(1, 'Bob', 'Thanks for sharing.'),
(2, 'Charlie', 'Interesting perspective.'),
(2, 'Dana', 'I disagree with your point.'),
(1, 'Eve', 'Loved this.'),
(1, 'Frank', 'Very helpful, thanks.'),
(1, 'Grace', 'Could use more detail.'),
(2, 'Heidi', 'I had a similar thought.'),
(2, 'Ivan', 'This is gold.'),
(2, 'Judy', 'I disagree, but respect your view.'),
(3, 'Karl', 'Nice explanation.'),
(3, 'Laura', 'Can you expand on this?'),
(3, 'Mallory', 'I learned something new today.'),
(3, 'Niaj', 'Your writing is improving.'),
(3, 'Olivia', 'Very relatable.'),
(4, 'Peggy', 'Keep it coming!'),
(4, 'Quentin', 'Too short, but good.'),
(4, 'Ruth', 'Excellent post.'),
(4, 'Sybil', 'You nailed it.'),
(5, 'Trent', 'What about the counterargument?'),
(5, 'Uma', 'Very well put.'),
(5, 'Victor', 'Thanks for posting this.'),
(5, 'Walter', 'Bookmarking this!'),
(5, 'Xena', 'When is the next post?'),
(5, 'Yvonne', 'I’ve shared this with my team.');
