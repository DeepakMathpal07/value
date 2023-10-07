import mongoose from "mongoose";
import User from "../models/userSchema.js";
import EvaulationQuestion from "../models/evaluationQuestionSchema.js";
import interviewQuestion from "../models/interviewQuestionSchema.js";

export const addEvaluationQuestion = async (req, response) => {
  try {
    //console.log(req.body);
    await User.findOne({ _id: req.body.user_id }, function (err, res) {
      if (!res) return res.status(400).json({ message: "User not found" });
      if (res.isAdmin === false)
        if (res.user_type !== 'Admin_User')
          return response.status(400).json({ message: "User is not an admin" });
    }).clone();
    let questions = req.body.questions;
    questions.forEach(async (question) => {
      let q = {
        question: question.question,
        answer: question.answer ? question.answer : "",
      };
      let ques = new EvaulationQuestion(q);
      await ques.save();
    });
    return response
      .status(200)
      .json({ message: "Questions added successfully" });
  } catch (err) {
    console.log(err);
  }
};
export const addInterviewQuestion = async (req, response) => {
  try {
    console.log(req.body);
    await User.findOne({ _id: req.body.user_id }, function (err, res) {
      if (!res) return res.status(400).json({ message: "User not found" });
      if (res.isAdmin === false)
        if (res.user_type !== 'Admin_User')
          return response.status(400).json({ message: "User is not an admin" });
    }).clone();

    let challenges = req.body.challenges;
    challenges.forEach((challenge)=>{
      let quest={};
      quest={
        type:challenge.type,
        difficulty:challenge.difficulty,
        description:challenge.description,
        question:challenge.question,
        solution:challenge.solution,
        skill:challenge.skill,
        topic:challenge.topic,
        instructions:challenge.instructions,
        hints:challenge.hints,
        wrench:challenge.wrench,
        solution:challenge.solution,
        input1:challenge.input1,
        input2:challenge.input2,
        input3:challenge.input3,
        input4:challenge.input4,
        input5:challenge.input5,
        output1:challenge.output1,
        output2:challenge.output2,
        output3:challenge.output3,
        output4:challenge.output4,
        output5:challenge.output5,
      }
      let ques = new interviewQuestion(quest);
      ques.save();
    });

    // let questions = req.body.questions;
    // console.log(req.body);
    // questions.forEach(async (question) => {
    //   let q = {
    //     question: question.question,
    //     answer: question.answer ? question.answer : "",
    //     type: question.type,
    //     level: question.level,
    //     experience: question.experience,
    //     category: question.category,
    //   };
    //   let ques = new interviewQuestion(q);
    //   await ques.save();
    //});
    return response
      .status(200)
      .json({ message: "Questions added successfully" });
  } catch (err) {
    console.log(err);
  }
};
export const fetchInterviewQuestion = async (req, response) => {
  try {
    interviewQuestion.find({}, function (err, res) {
      if (err) {
        return response.send().status(400);
      } else {
        return response.status(200).json({ ques: res });
      }
    })

  } catch (err) {
    console.log(err);
  }
};

export const updateInterviewQuestion = async (req, response) => {
  try {

console.log(req.body)

    interviewQuestion.findOneAndUpdate({_id:req.body.id},req.body.updates, function (err, res) {
      if (err) {
        return response.send().status(400);

      } else {

        return response
          .status(200)
          .json({ ques: res });
      }
    })

  } catch (err) {
    console.log(err);
  }
};
