import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Problem } from '../models/Problem.js';

dotenv.config();

const problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    difficulty: "Easy",
    starterCode: {
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    \n}",
      javascript: "var twoSum = function(nums, target) {\n    \n};",
      python: "def twoSum(nums, target):\n    pass"
    },
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: false },
      { input: "[1,5,8], 13", expectedOutput: "[1,2]", isHidden: true },
      { input: "[10,20,30,40], 70", expectedOutput: "[2,3]", isHidden: true },
      { input: "[-1,-2,-3,-4,-5], -8", expectedOutput: "[2,4]", isHidden: true },
      { input: "[0,4,3,0], 0", expectedOutput: "[0,3]", isHidden: true },
      { input: "[-3,4,3,90], 0", expectedOutput: "[0,2]", isHidden: true },
      { input: "[1,2,3], 5", expectedOutput: "[1,2]", isHidden: true },
      { input: "[1,2,3,4,5,6], 11", expectedOutput: "[4,5]", isHidden: true },
      { input: "[100,200,300], 500", expectedOutput: "[1,2]", isHidden: true },
      { input: "[5,25,75], 100", expectedOutput: "[1,2]", isHidden: true },
      { input: "[1,1,1,1,1,4,1,1], 5", expectedOutput: "[4,5]", isHidden: true },
      { input: "[0,1,2], 1", expectedOutput: "[0,1]", isHidden: true },
      { input: "[2,5,5,11], 10", expectedOutput: "[1,2]", isHidden: true }
    ]
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    description: "Write a function that reverses a string. The input string is given as an array of characters `s`.",
    difficulty: "Easy",
    starterCode: {
      cpp: "void reverseString(vector<char>& s) {\n    \n}",
      javascript: "var reverseString = function(s) {\n    \n};",
      python: "def reverseString(s):\n    pass"
    },
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false },
      { input: '["a"]', expectedOutput: '["a"]', isHidden: false },
      { input: '["b","a","t"]', expectedOutput: '["t","a","b"]', isHidden: true },
      { input: '["r","a","c","e"]', expectedOutput: '["e","c","a","r"]', isHidden: true },
      { input: '["A","B"]', expectedOutput: '["B","A"]', isHidden: true },
      { input: '["1","2","3"]', expectedOutput: '["3","2","1"]', isHidden: true },
      { input: '["!","?"]', expectedOutput: '["?","!"]', isHidden: true },
      { input: '[" "]', expectedOutput: '[" "]', isHidden: true },
      { input: '["x","y","z","w"]', expectedOutput: '["w","z","y","x"]', isHidden: true },
      { input: '["k","o","o","k"]', expectedOutput: '["k","o","o","k"]', isHidden: true },
      { input: '["m","o","m"]', expectedOutput: '["m","o","m"]', isHidden: true },
      { input: '["t","e","s","t"]', expectedOutput: '["t","s","e","t"]', isHidden: true },
      { input: '["n","o","d","e"]', expectedOutput: '["e","d","o","n"]', isHidden: true },
      { input: '["f","i","n","a","l"]', expectedOutput: '["l","a","n","i","f"]', isHidden: true }
    ]
  },
  {
    title: "Palindrome Number",
    slug: "palindrome-number",
    description: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.",
    difficulty: "Easy",
    starterCode: {
        cpp: "bool isPalindrome(int x) {\n    \n}",
        javascript: "var isPalindrome = function(x) {\n    \n};",
        python: "def isPalindrome(x):\n    pass"
    },
    testCases: [
      { input: "121", expectedOutput: "true", isHidden: false },
      { input: "-121", expectedOutput: "false", isHidden: false },
      { input: "10", expectedOutput: "false", isHidden: false },
      { input: "0", expectedOutput: "true", isHidden: true },
      { input: "12321", expectedOutput: "true", isHidden: true },
      { input: "4444", expectedOutput: "true", isHidden: true },
      { input: "123", expectedOutput: "false", isHidden: true },
      { input: "1001", expectedOutput: "true", isHidden: true },
      { input: "999", expectedOutput: "true", isHidden: true },
      { input: "1221", expectedOutput: "true", isHidden: true },
      { input: "5", expectedOutput: "true", isHidden: true },
      { input: "123456", expectedOutput: "false", isHidden: true },
      { input: "-101", expectedOutput: "false", isHidden: true },
      { input: "11", expectedOutput: "true", isHidden: true },
      { input: "123321", expectedOutput: "true", isHidden: true }
    ]
  },
  {
    title: "Fibonacci Number",
    slug: "fibonacci-number",
    description: "The Fibonacci numbers, commonly denoted `F(n)` form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. Given `n`, calculate `F(n)`.",
    difficulty: "Easy",
    starterCode: {
        cpp: "int fib(int n) {\n    \n}",
        javascript: "var fib = function(n) {\n    \n};",
        python: "def fib(n):\n    pass"
    },
    testCases: [
      { input: "2", expectedOutput: "1", isHidden: false },
      { input: "3", expectedOutput: "2", isHidden: false },
      { input: "4", expectedOutput: "3", isHidden: false },
      { input: "0", expectedOutput: "0", isHidden: true },
      { input: "1", expectedOutput: "1", isHidden: true },
      { input: "5", expectedOutput: "5", isHidden: true },
      { input: "6", expectedOutput: "8", isHidden: true },
      { input: "7", expectedOutput: "13", isHidden: true },
      { input: "8", expectedOutput: "21", isHidden: true },
      { input: "9", expectedOutput: "34", isHidden: true },
      { input: "10", expectedOutput: "55", isHidden: true },
      { input: "11", expectedOutput: "89", isHidden: true },
      { input: "12", expectedOutput: "144", isHidden: true },
      { input: "13", expectedOutput: "233", isHidden: true },
      { input: "20", expectedOutput: "6765", isHidden: true }
    ]
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    difficulty: "Medium",
    starterCode: {
        cpp: "bool isValid(string s) {\n    \n}",
        javascript: "var isValid = function(s) {\n    \n};",
        python: "def isValid(s):\n    pass"
    },
    testCases: [
      { input: '"()"', expectedOutput: "true", isHidden: false },
      { input: '"()[]{}"', expectedOutput: "true", isHidden: false },
      { input: '"(]"', expectedOutput: "false", isHidden: false },
      { input: '"([)]"', expectedOutput: "false", isHidden: true },
      { input: '"{[]}"', expectedOutput: "true", isHidden: true },
      { input: '""', expectedOutput: "true", isHidden: true },
      { input: '"["', expectedOutput: "false", isHidden: true },
      { input: '"]"', expectedOutput: "false", isHidden: true },
      { input: '"((("', expectedOutput: "false", isHidden: true },
      { input: '")))"', expectedOutput: "false", isHidden: true },
      { input: '"({})"', expectedOutput: "true", isHidden: true },
      { input: '"({[()]})"', expectedOutput: "true", isHidden: true },
      { input: '"(([]){})"', expectedOutput: "true", isHidden: true },
      { input: '"([]"', expectedOutput: "false", isHidden: true },
      { input: '"((((((()))))))"', expectedOutput: "true", isHidden: true }
    ]
  },
  {
    title: "Single Number",
    slug: "single-number",
    description: "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.",
    difficulty: "Easy",
    starterCode: {
        cpp: "int singleNumber(vector<int>& nums) {\n    \n}",
        javascript: "var singleNumber = function(nums) {\n    \n};",
        python: "def singleNumber(nums):\n    pass"
    },
    testCases: [
      { input: "[2,2,1]", expectedOutput: "1", isHidden: false },
      { input: "[4,1,2,1,2]", expectedOutput: "4", isHidden: false },
      { input: "[1]", expectedOutput: "1", isHidden: false },
      { input: "[7,3,7]", expectedOutput: "3", isHidden: true },
      { input: "[10,10,20,30,30]", expectedOutput: "20", isHidden: true },
      { input: "[-1,-1,-2]", expectedOutput: "-2", isHidden: true },
      { input: "[0,1,0]", expectedOutput: "1", isHidden: true },
      { input: "[100,200,100]", expectedOutput: "200", isHidden: true },
      { input: "[5,5,9,1,1]", expectedOutput: "9", isHidden: true },
      { input: "[2,3,4,2,3]", expectedOutput: "4", isHidden: true },
      { input: "[8,8,7,6,6]", expectedOutput: "7", isHidden: true },
      { input: "[1,2,1,2,3]", expectedOutput: "3", isHidden: true },
      { input: "[11,22,11,22,33]", expectedOutput: "33", isHidden: true },
      { input: "[45,45,12]", expectedOutput: "12", isHidden: true },
      { input: "[1,2,3,4,5,1,2,3,4]", expectedOutput: "5", isHidden: true }
    ]
  },
  {
    title: "Fizz Buzz",
    slug: "fizz-buzz",
    description: "Given an integer `n`, return a string array `answer` where `answer[i] == 'FizzBuzz'` if `i` is divisible by 3 and 5, `'Fizz'` if divisible by 3, and `'Buzz'` if divisible by 5.",
    difficulty: "Easy",
    starterCode: {
        cpp: "vector<string> fizzBuzz(int n) {\n    \n}",
        javascript: "var fizzBuzz = function(n) {\n    \n};",
        python: "def fizzBuzz(n):\n    pass"
    },
    testCases: [
      { input: "3", expectedOutput: '["1","2","Fizz"]', isHidden: false },
      { input: "5", expectedOutput: '["1","2","Fizz","4","Buzz"]', isHidden: false },
      { input: "15", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: false },
      { input: "1", expectedOutput: '["1"]', isHidden: true },
      { input: "2", expectedOutput: '["1","2"]', isHidden: true },
      { input: "4", expectedOutput: '["1","2","Fizz","4"]', isHidden: true },
      { input: "6", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz"]', isHidden: true },
      { input: "0", expectedOutput: '[]', isHidden: true },
      { input: "7", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7"]', isHidden: true },
      { input: "8", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8"]', isHidden: true },
      { input: "9", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz"]', isHidden: true },
      { input: "10", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz"]', isHidden: true },
      { input: "11", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11"]', isHidden: true },
      { input: "12", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz"]', isHidden: true },
      { input: "16", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz","16"]', isHidden: true }
    ]
  },
  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
    difficulty: "Easy",
    starterCode: {
        cpp: "bool containsDuplicate(vector<int>& nums) {\n    \n}",
        javascript: "var containsDuplicate = function(nums) {\n    \n};",
        python: "def containsDuplicate(nums):\n    pass"
    },
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
      { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
      { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: false },
      { input: "[]", expectedOutput: "false", isHidden: true },
      { input: "[1]", expectedOutput: "false", isHidden: true },
      { input: "[1,1]", expectedOutput: "true", isHidden: true },
      { input: "[5,6,7,8,5]", expectedOutput: "true", isHidden: true },
      { input: "[10,20,30]", expectedOutput: "false", isHidden: true },
      { input: "[0,0]", expectedOutput: "true", isHidden: true },
      { input: "[1,2,1]", expectedOutput: "true", isHidden: true },
      { input: "[9,8,7,6]", expectedOutput: "false", isHidden: true },
      { input: "[100,101,100]", expectedOutput: "true", isHidden: true },
      { input: "[-1,-2,-1]", expectedOutput: "true", isHidden: true },
      { input: "[1,2,3,4,5,6,7,8,9,0]", expectedOutput: "false", isHidden: true },
      { input: "[1,1,2,2]", expectedOutput: "true", isHidden: true }
    ]
  },
  {
    title: "Power of Two",
    slug: "power-of-two",
    description: "Given an integer `n`, return `true` if it is a power of two. Otherwise, return `false`.",
    difficulty: "Easy",
    starterCode: {
        cpp: "bool isPowerOfTwo(int n) {\n    \n}",
        javascript: "var isPowerOfTwo = function(n) {\n    \n};",
        python: "def isPowerOfTwo(n):\n    pass"
    },
    testCases: [
      { input: "1", expectedOutput: "true", isHidden: false },
      { input: "16", expectedOutput: "true", isHidden: false },
      { input: "3", expectedOutput: "false", isHidden: false },
      { input: "4", expectedOutput: "true", isHidden: true },
      { input: "8", expectedOutput: "true", isHidden: true },
      { input: "32", expectedOutput: "true", isHidden: true },
      { input: "64", expectedOutput: "true", isHidden: true },
      { input: "100", expectedOutput: "false", isHidden: true },
      { input: "2", expectedOutput: "true", isHidden: true },
      { input: "0", expectedOutput: "false", isHidden: true },
      { input: "-16", expectedOutput: "false", isHidden: true },
      { input: "1024", expectedOutput: "true", isHidden: true },
      { input: "512", expectedOutput: "true", isHidden: true },
      { input: "256", expectedOutput: "true", isHidden: true },
      { input: "12", expectedOutput: "false", isHidden: true }
    ]
  },
  {
    title: "Valid Anagram",
    slug: "valid-anagram",
    description: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
    difficulty: "Easy",
    starterCode: {
        cpp: "bool isAnagram(string s, string t) {\n    \n}",
        javascript: "var isAnagram = function(s, t) {\n    \n};",
        python: "def isAnagram(s, t):\n    pass"
    },
    testCases: [
      { input: '"anagram", "nagaram"', expectedOutput: "true", isHidden: false },
      { input: '"rat", "car"', expectedOutput: "false", isHidden: false },
      { input: '"a", "a"', expectedOutput: "true", isHidden: false },
      { input: '"ab", "ba"', expectedOutput: "true", isHidden: true },
      { input: '"abc", "def"', expectedOutput: "false", isHidden: true },
      { input: '"listen", "silent"', expectedOutput: "true", isHidden: true },
      { input: '"hello", "world"', expectedOutput: "false", isHidden: true },
      { input: '"cat", "act"', expectedOutput: "true", isHidden: true },
      { input: '"night", "thing"', expectedOutput: "true", isHidden: true },
      { input: '"apple", "papel"', expectedOutput: "true", isHidden: true },
      { input: '"test", "tset"', expectedOutput: "true", isHidden: true },
      { input: '"node", "deno"', expectedOutput: "true", isHidden: true },
      { input: '"javascript", "scriptjava"', expectedOutput: "true", isHidden: true },
      { input: '"binary", "brainy"', expectedOutput: "true", isHidden: true },
      { input: '"secure", "rescue"', expectedOutput: "true", isHidden: true }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Seeding...");

    // Clean up existing problems to prevent slug collisions
    await Problem.deleteMany({});
    console.log("Old problems cleared.");

    await Problem.insertMany(problems);
    console.log("Successfully seeded 10 problems with 15 test cases each!");
    const count = await Problem.countDocuments();
    console.log(`Total problems in DB: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();