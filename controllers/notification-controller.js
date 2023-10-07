import Notification from "../models/notificationSchema.js";
import User from "../models/userSchema.js";
import {} from "dotenv/config";
import sendGridMail from "@sendgrid/mail";
import twilio from "twilio";

// const accountSid = 'ACf7a405cd8ab7420880319015e48606da';
// const authToken = '[Redacted]';
// const client = require('twilio')(accountSid, authToken);

// client.messages
//       .create({
//          body: 'Your appointment is coming up on July 21 at 3PM',
//          from: 'whatsapp:+14155238886',
//          to: 'whatsapp:+919617949056'
//        })
//       .then(message => console.log(message.sid))
//       .done();

//const accountSid = process.env.TRILLIO_ACCOUNT_SID;
//const authToken = process.env.TRILLIO_AUTH_TOKEN;

//const client = new twilio(accountSid, authToken);

export const whatsappMessage = async (request, response) => {
  try {
    User.findOne({ _id: request.body.user_id }, function (err, res) {
      if (!res || !res.isAdmin) response.status(403);
    });
    let query = null;
    switch (request.body.sendTo) {
      case "All":
        query = User.find({}).select("contact");
        break;
      case "User":
        query = User.find({ isAdmin: false }).select("contact");
        break;
      case "Admin":
        query = User.find({ isAdmin: true }).select("contact");
        break;
    }
    if (query) {
      await query.exec(async function (err, res) {
       // console.log("RES:", res);
        if (err) {
          response.json({ Error: "Cannot Send Mails" });
          return;
        }
        let contact = [];
        res.map((item) => contact.push(item.contact));
        console.log(contact);
      });
    }

    client.messages
      .create({
        body: request.body.contents,
        from: "whatsapp:+14155238886",
        to: `whatsapp:+91${request.body.contactList}`,
      })
      .then((message) => console.log(message.sid))
      .done();

    response.status(200).json({ Message: "Notification Added" });
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Push Notifications To Database
export const pushNotification = async (request, response) => {
  try {
    User.findOne({ _id: request.body.user_id }, function (err, res) {
      if (!res || !res.isAdmin) response.status(403);
    });

    if (request.body.emailList && request.body.emailList.length > 0) {
      let query = User.find({ email: { $in: request.body.emailList } }).select(
        "_id"
      );
      let userIds = await query.exec();

      let noti = new Notification({
        title: request.body.title,
        message: request.body.message,
        forAll : false,
        
        sendTo: userIds.map((user) => user.id),
      });
      await noti.save();
      response.status(200).json({ message: "Notification Added" });
    } else {
      let forAll = null,
        user_type = null;
      if (request.body.forAll === "All") {
        forAll = true;
        user_type = ["All"];
      } else {
        forAll = false;
        user_type = request.body.forAll;
      }
      let noti = new Notification({
        title: request.body.title,
        message: request.body.message,
        forAll: forAll,
        user_type: user_type,
      });
      noti.save();
      response.status(200).json({ Message: "Notification Added" });
    }
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Get Notifications For User
export const getUserNotification = async (request, response) => {
  try {
    Notification.find({
      $or: [
        {
          forAll: true,
          hideFrom: { $ne: request.body.user_id },
          timeCreated: { $gte: request.body.user.timeRegistered },
          type: "Notification",
        },
        {
          forAll: false,
          user_type: request.body.user.user_type,
          hideFrom: { $ne: request.body.user_id },
          timeCreated: { $gte: request.body.user.timeRegistered },
          type: "Notification",
        },
        {
          sendTo: { $in: [request.body.user_id] },
          type: "Notification",
          hideFrom: { $ne: request.body.user_id },
        },
      ],
    })
      .sort({ timeCreated: -1 })
      .exec(function (err, res) {
        if (res) {
          response.status(200).json({ notifications: res });
        } else response.json({ Error: "No Notification Found" });
      });
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const getAdminNotification = async (request, response) => {
  try {
    Notification.find(
      {
        $or: [
          {
            forAll: true,
            hideFrom: { $ne: request.body.user_id },
            timeCreated: { $gte: request.body.user.timeRegistered },
            type: "Notification",
          },
          {
            forAll: false,
            user_type: "Admin",
            hideFrom: { $ne: request.body.user_id },
            timeCreated: { $gte: request.body.user.timeRegistered },
            type: "Notification",
          },
        ],
      },
      function (err, res) {
        console.log(res);
        if (res) {
          response.status(200).json({ notifications: res });
        } else response.json({ Error: "No Notification Found" });
      }
    );
  } catch (error) {
    console.log("Error : ", error);
  }
  s;
};

// Mark Notification Read for User
// export const markNotiReadForUser = async (request, response) => {
//   try {
//     Notification.findOne({ _id: request.body.noti_id }, function (err, res) {
//       if (res) {
//         let users = res.hideFrom;
//         users.push(request.body.user_id);
//         res.hideFrom = users;
//         res.save();
//         response.status(200).json({ Message: "Marked As Read" });
//       } else {
//         response.json({ Error: "Cannot Get Notification" });
//       }
//     });
//   } catch (error) {
//     console.log("Error : ", error);
//   }
// };

// Mark Notification Read for User
export const markNotiReadForUser = async (request, response) => {
  try {
    Notification.findOne({ _id: request.body.noti_id }, async function (err, res) {
      if (res) {/*
        let users = res.hideFrom;
        users.push(request.body.user_id)*/;
        let ussrr = await Notification.findOneAndUpdate(
            { _id: request.body.noti_id },
            { isRead: request.body.isRead } , {new : true}
          );
        // res.hideFrom = users;
        res.save();
        response.status(200).json({ Message: "Marked As Read" });
      } else {
        response.json({ Error: "Cannot Get Notification" });
      }
    });
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Email Notifications
export const sendEmailNotification = async (request, response) => {
  try {
    User.findOne({ _id: request.body.user_id }, function (err, res) {
      if (err || res.isAdmin === false) {
        response.status(403);
        return;
      }
    });

    let query = null;
    let to = null;
    if (request.body.emailList.length === 0) {
      switch (request.body.sendTo) {
        case "All":
          query = User.find({}).select("email");
          break;
        case "User":
          query = User.find({ isAdmin: false }).select("email");
          break;
        case "Admin":
          query = User.find({ isAdmin: true }).select("email");
          break;
      }
      let noti = new Notification({
        forAll: request.body.sendTo === "All" ? true : false,
        title: request.body.subject,
        message: request.body.text,
        user_type: request.body.sendTo,
      });
      await noti.save();
      await query.exec(async function (err, res) {
        if (err) {
          response.json({ Error: "Cannot Send Mails" });
          return;
        }
        let email = [];
        res.map((item) => email.push(item.email));
        console.log(email);
        await sendGridMail
          .send({
            to: email,
            from: supportEmail,
            subject: request.body.subject,
            text: request.body.text,
          })
          .then(() => {
            console.log("Sent");
            return response
              .status(200)
              .json({ Message: "Emails Sent Successfully" });
          })
          .catch((err) => {
            console.log(err);
            console.log("Not Sent");
            return response.status(401).json({ Error: "Email Not Sent" });
          });
      });
    } else {
      to = request.body.emailList;
      let noti = new Notification({
        forAll: false,
        title: request.body.subject,
        message: request.body.text,
        sendTo: request.body.emailList,
      });
      await noti.save();
      await sendGridMail.send({
        to: to,
        from: supportEmail,
        subject: request.body.subject,
        text: request.body.text,
      });
      response.status(200).json({ Message: "Emails Sent Successfully"});
    }
  } catch (err) {
    console.log(err);
  }
};

// Detete Notification
export const deleteNotification = async (request, response) => {
  console.log("req" , request.body.data)
  let deleteId = request.body.data.noti_id;
  if (deleteId) {
    try {
      Notification.findOneAndDelete(
        { _id: request.body.data.noti_id },
        function (err, res) {
          if (res) {
            response.status(200).json({ Message: "Notification Deleted" });
          } else response.json({ Error: "Cannot Delete Notification" });
        }
      );
    } catch (error) {
      console.log("Error : ", error);
    }
  } else {
    response.json({ Error: "No Notification" });
  }
};
