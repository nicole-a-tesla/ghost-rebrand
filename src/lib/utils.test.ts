import { describe, test, expect } from 'vitest';
import { findAndReplaceAll } from "./utils";

describe("findAndReplaceAll", () => {
  test("resplaces all occurrences of a simple string", () => {
    const source = "The quick brown fox jumps over the lazy fox";
    const result = findAndReplaceAll(source, "fox", "dog");
    expect(result).toBe('The quick brown dog jumps over the lazy dog');
  });

  test('works with empty source string', () => {
    expect(findAndReplaceAll('', 'something', 'nothing')).toBe('');
  });

  test('returns original string when search string not found', () => {
    const source = 'The quick brown fox jumps over the lazy dog';
    const result = findAndReplaceAll(source, 'cat', 'tiger');
    expect(result).toBe(source);
  });

  test('works with empty search string', () => {
    const source = 'The quick brown fox';
    expect(findAndReplaceAll(source, '', 'dog')).toBe(source);
  });

  test('works with empty replacement string', () => {
    const source = 'The quick brown fox jumps over the lazy fox';
    const result = findAndReplaceAll(source, 'fox', '');
    expect(result).toBe('The quick brown  jumps over the lazy ');
  });

  test('is case sensitive', () => {
    const source = 'The Fox and the fox are different FOX animals';
    const result = findAndReplaceAll(source, 'fox', 'dog');
    expect(result).toBe('The Fox and the dog are different FOX animals');
  });

  test('replaces company name with special characters', () => {
    const source = 'Welcome to The Sunday Star! The Sunday Star is a news. Contact The Sunday Star at contact@sundaystar.com.';
    const result = findAndReplaceAll(source, 'The Sunday Star', 'Johnson\'s News & Co');
    expect(result).toBe('Welcome to Johnson\'s News & Co! Johnson\'s News & Co is a news. Contact Johnson\'s News & Co at contact@sundaystar.com.');
  });

  test('handles replacement string containing regex special characters', () => {
    const source = 'Contact us at support team.';
    const result = findAndReplaceAll(source, 'support team', 'support@example.com (24/7)');
    expect(result).toBe('Contact us at support@example.com (24/7).');
  });

  test('handles very long strings', () => {
    const source = 'a'.repeat(10000) + 'fox' + 'b'.repeat(10000);
    const result = findAndReplaceAll(source, 'fox', 'dog');
    expect(result).toBe('a'.repeat(10000) + 'dog' + 'b'.repeat(10000));
  });

  test('handles Unicode characters', () => {
    const source = 'This café is good and so is that café';
    const result = findAndReplaceAll(source, 'café', 'restaurant');
    expect(result).toBe('This restaurant is good and so is that restaurant');
  });

  test('handles emoji in source and replacement', () => {
    const source = 'I 💖 seagulls and they 💖 trash';
    const result = findAndReplaceAll(source, '💖', '❤️');
    expect(result).toBe('I ❤️ seagulls and they ❤️ trash');
  });

  describe('handles regex special characters in search string', () => {
    test('handles regex special characters in search string: dot (.)', () => {
      const source = 'The website is example.com not exampleXcom';
      const result = findAndReplaceAll(source, 'example.com', 'example.org');
      expect(result).toBe('The website is example.org not exampleXcom');
    });

    test('handles regex special characters in search string: plus (+)', () => {
      const source = 'A+ rating is better than an A rating';
      const result = findAndReplaceAll(source, 'A+', 'A++');
      expect(result).toBe('A++ rating is better than an A rating');
    });

    test('handles regex special characters in search string: asterisk (*)', () => {
      const source = 'Read the * footnote';
      const result = findAndReplaceAll(source, '*', '**');
      expect(result).toBe('Read the ** footnote');
    });

    test('handles regex special characters in search string: question mark (?)', () => {
      const source = 'Will this work? Yes, it will.';
      const result = findAndReplaceAll(source, '?', '??');
      expect(result).toBe('Will this work?? Yes, it will.');
    });

    test('handles regex special characters in search string: parentheses ()', () => {
      const source = 'The company (and its subsidiaries) is large';
      const result = findAndReplaceAll(source, '(and its subsidiaries)', '(global)');
      expect(result).toBe('The company (global) is large');
    });

    test('handles regex special characters in search string: square brackets []', () => {
      const source = 'Select options [1] or [2]';
      const result = findAndReplaceAll(source, '[1]', '[one]');
      expect(result).toBe('Select options [one] or [2]');
    });

    test('handles regex special characters in search string: curly braces {}', () => {
      const source = 'Template values are {first} and {last}';
      const result = findAndReplaceAll(source, '{first}', '{firstName}');
      expect(result).toBe('Template values are {firstName} and {last}');
    });

    test('handles regex special characters in search string: caret (^)', () => {
      const source = 'The ^ symbol is used for exponents';
      const result = findAndReplaceAll(source, '^', '**');
      expect(result).toBe('The ** symbol is used for exponents');
    });

    test('handles regex special characters in search string: dollar sign ($)', () => {
      const source = 'The price is $10 not €10';
      const result = findAndReplaceAll(source, '$10', '$20');
      expect(result).toBe('The price is $20 not €10');
    });

    test('handles regex special characters in search string: pipe (|)', () => {
      const source = 'Option A | Option B';
      const result = findAndReplaceAll(source, '|', 'or');
      expect(result).toBe('Option A or Option B');
    });

    test('handles regex special characters in search string: backslash (\\)', () => {
      const source = 'C:\\Program Files\\App';
      const result = findAndReplaceAll(source, 'C:\\Program Files', 'D:\\Programs');
      expect(result).toBe('D:\\Programs\\App');
    });
  });
});