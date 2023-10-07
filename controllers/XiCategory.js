import XICategory from "../models/xiCategorySchema.js";
import XIPanels from "../models/xiPanelsSchema.js";
import PerformanceMultiplier from "../models/performanceMultiplierSchema.js";
import Level from "../models/levelSchema.js";
import CreditCategory from "../models/creditCategorySchema.js"
import { getUserFromid } from "./userController.js";
import User from "../models/userSchema.js";

// test code
// export const ListXIPanels = async(req,res)=>{
//     try {
//          const panels = await XIPanels.find({ isDeleted: false });
//         if (panels && panels.length > 0) {
//             let matchedusers
//             for (let i = 0;i<panels.length;i++) {
//                 const elem = panels[i]
//                 if (elem.xiIds.length > 0) {
//                     let ids = elem.xiIds
//                     const users = await ids.map(async (xiId) => {
//                         console.log('xi id------',xiId.length)
//                         if (xiId.length > 1) {
//                                     const user = await getUserFromid(xiId);
//                                     if (user) {
//                                         return {
//                                              xiId: user._id,
//                                             firstName: user.firstName,
//                                             lastname: user.lastname,
//                                             profileImg: user.profileImg,
//                                         }
//                                     }
//                         }
//                         });
//                     // console.log('---------user', users)
//                     // matchedusers = await User.find({_id :{$in:ids}})
//                 }
//                //  console.log('elem------',elem)
//                 // let xiarr = elem.xiIds
//                 //  matchedusers = await User.find({_id :{$in:xiarr}})
//             }
//            //  console.log('matche users----------', matchedusers)
//         }
//     } catch (error) {
        
//     }
// }
// ednd code

// List all panels

export const ListXIPanels = async (request, response) => {
    try {
        const panels = await XIPanels.find({ isDeleted: false });
        const xiPanels = await Promise.all(
            panels.map(async (panel) => {
                const users = await Promise.all(panel.xiIds.map(async (xiId) => {
                    const user = await getUserFromid(xiId);
                   if (user) {
                    return {
                        xiId: user._id,
                        firstName: user.firstName,
                        lastname: user.lastname,
                        profileImg: user.profileImg,
                    }
                   }
                }));

                return {
                    _id: panel._id,
                    panel: panel.panelName,
                    skills: panel.skills,
                    permissions: panel.permissions,
                    isDeleted: panel.isDeleted,
                    users: users,
                };
            })
        );
        return response.status(200).json({ panels: xiPanels });
    } catch (error) {
        console.log("Error :", error);
        return response.status(500).json({ message: "Internal server error" });
    }
};

// update XI panel with xi
//     try {
//         const { id, xiIds } = request.body;

//         if (!id || !xiIds || !Array.isArray(xiIds)) {
//             return response.status(400).json({ Message: "Invalid request body" });
//         }

//         const panel = await XIPanels.findOneAndUpdate(
//             { _id: id, isDeleted: false },
//             { $addToSet: { xiIds: { $each: xiIds } } },
//             { new: true }
//         );

//         if (!panel) {
//             return response.status(404).json({ Message: "Panel not found" });
//         }

//         const users = await Promise.all(panel.xiIds.map(async (xiId) => {
//             const user = await getUserFromid(xiId);
//             return {
//                 xiId: user.xiId,
//                 firstName: user.firstName,
//                 lastname: user.lastname,
//                 profileImg: user.profileImg,
//             }
//         }));

//         const updatedPanel = {
//             _id: panel._id,
//             panel: panel.panel,
//             permissions: panel.permissions,
//             isDeleted: panel.isDeleted,
//             users: users,
//         };

//         return response.status(200).json({ Message: "Success", panel: updatedPanel });
//     } catch (error) {
//         console.log(error);
//         return response.status(400).json({ Message: "Error" });
//     }
// };

export const updateXIPanels = async (request, response) => {
    try {
        const { _id, xiIds } = request.body;
        console.log(_id, xiIds, 'printing ids and xiiDs')

        if (!_id || !xiIds) {
            return response.status(400).json({ Message: "Invalid request body" });
        }

        const panel = await XIPanels.findOne({ _id: _id });
        if (!panel) {
            return response.status(400).json({ Message: "Panel not found" });
        }

        panel.xiIds.push(xiIds); // add the new xiId to the xiIds array

        await panel.save();
        return response.status(200).json({ Message: "Success" });
    } catch (error) {
        console.log(error);
        return response.status(400).json({ Message: "Error" });
    }
};

// update XIpanel with skill


export const updateSkillPanel = async (req, res) => {
    console.log(req.body, 'updateSkillPanel api');
    
    // console.log(data, 'printing updateSkillPanel')
    const { _id, xiIds } = req.body;
    // console.log(_id, xiIds, 'printing updateSkillPanel')

    try {
        const panel = await XIPanels.findById(_id);
        if (panel) {
            if (panel.skills) {
               await XIPanels.updateOne({_id},{$push:{skills:xiIds}}).then((result) => 
                {
                    if (result) {
                        return res.status(200).json({ Message: "Success" });
                     }
                }
               )
            }else {
                console.log('empty skill')
            }
        }
        // if (!panel) {
        //     return { status: 404, message: "Panel not found" };
        // }

        // // Add the new xiId(s) to the panel's xiIds array
        // panel.skills.push(...xiIds);

        // // Save the updated panel
        // const updatedPanel = await panel.save();

        // return { status: 200, data: updatedPanel }; 
    } catch (error) {
        console.log("Error :", error);
        return { status: 500, message: "Internal server error" };
    }
};



// add new panel
export const addXIPanels = async (request, response) => {
    try {
        const { panelName, skills, xiIds, permissions } = request.body;
        console.log(request.body, 'printing request body in addXI panel')

        if (!panelName || !Array.isArray(skills) || !Array.isArray(xiIds) || !permissions) {
            return response.status(400).json({ Message: "Invalid request body" });
        }

        const user = new XIPanels({
            panelName,
            skills,
            xiIds,
            permissions
        });

        await user.save();
        return response.status(200).json({ Message: "Success" });
    } catch (error) {
        console.log(error);
        return response.status(400).json({ Message: "Error" });
    }
};

// Deleting a skill from existing panel

export const deleteSkillFromPanel = async (request, response) => {
    try {
        const { panelId, skills } = request.body;
        console.log(request.body, 'printing request body in deleteSkillFromPanel')

        if (!panelId || !skills) {
            return response.status(400).json({ Message: "Invalid request body" });
        }

        const panel = await XIPanels.findById(panelId);

        if (!panel) {
            return response.status(404).json({ Message: "Panel not found" });
        }

        const updatedSkills = panel.skills.filter((existingSkill) => existingSkill !== skills);

        panel.skills = updatedSkills;
        await panel.save();

        return response.status(200).json({ Message: "Success" });
    } catch (error) {
        console.log(error);
        return response.status(400).json({ Message: "Error" });
    }
};

// Delete xid from existing panel

export const deleteXidFromPanel = async (request, response) => {
    try {
        const { panelId, xid } = request.body;
        console.log(request.body, 'printing request body in deleteXidFromPanel')

        if (!panelId || !xid) {
            return response.status(400).json({ Message: "Invalid request body" });
        }

        const updatedPanel = await XIPanels.findByIdAndUpdate(
            panelId,
            { $pull: { xiIds: xid } },
            { new: true }
        );

        if (!updatedPanel) {
            return response.status(404).json({ Message: "Panel not found" });
        }

        return response.status(200).json({ Message: "Success" });
    } catch (error) {
        console.log(error);
        return response.status(400).json({ Message: "Error" });
    }
};



export const ListXICategory =async (request ,response)=>{
    try {
        await XICategory.find({isDeleted:false},function(err,res){
            if(err){
                console.log(err)
            }else{
                return response.status(200).json({category:res});
            }
        }) 
    } catch (error) {
        
    }
  
}
export const updateXICategory =async(request ,response)=>{
    try {
        // console.log(request.body)
        let user1 = await XICategory.findOneAndUpdate(
            { _id: request.body.id },
            request.body.updates,
            
          );
          await XICategory.find({isDeleted:false},function(err,res){
            if(err){
                console.log(err)
            }else{
                return response.status(200).json({category:res});
            }
        }) 
    } catch (error) {
        
    }
   
}
export const addXICategory =async(request ,response)=>{
    try {
        console.log(request.body)
       let category ={
        category : request.body.category,
        cat : request.body.cat,
        limit : request.body.limit,
        payout : request.body.payout,
       }

       const user = new XICategory(category);
       await user.save();
       return response.status(200).json({Message:"Success"});
    } catch (error) {
        return response.status(400).json({Message:"Error"});
        
    }
   
}

export const addXIMultiplier =async(request ,response)=>{
    try {
        console.log(request.body)
       let category ={
        multiplier : request.body.multiplier,
        min : request.body.min,
        max : request.body.max,
       }

       const user = new PerformanceMultiplier(category);
       await user.save();
       return response.status(200).json({Message:"Success"});
    } catch (error) {
        return response.status(400).json({Message:"Error"});
        
    }
   
}



export const ListXIMultiplier =async(request ,response)=>{
    try {
       await PerformanceMultiplier.find({isDeleted:false},function(err,res){
            if(err){
                console.log(err)
            }else{
                return response.status(200).json({category:res});
            }
        })
    } catch (error) {
        
    }
  
}
export const updateXIMultiplier =async(request ,response)=>{
    try {
        let user1 = await PerformanceMultiplier.findOneAndUpdate(
            { _id: request.body.id },
            request.body.updates,
            { new: true }
          );
          await PerformanceMultiplier.find({isDeleted:false},function(err,res){
            if(err){
                console.log(err)
            }else{
                return response.status(200).json({category:res});
            }})
    } catch (error) {
        
    }
   
 
}

export const addXILevel =async(request ,response)=>{
    try {
        console.log(request.body)
       let category ={
        level : request.body.level,
        min : request.body.min,
        max : request.body.max,
       }

       const user = new Level(category);
       await user.save();
       return response.status(200).json({Message:"Success"});
    } catch (error) {
        return response.status(400).json({Message:"Error"});
        
    }
   
}



export const ListXILevel =async(request ,response)=>{
    try {
       await Level.find({isDeleted:false},function(err,res){
            if(err){
                console.log(err)
            }else{
                return response.status(200).json({category:res});
            }
        })
    } catch (error) {
        
    }
 
}
export const updateXILevel =async(request ,response)=>{
    try {
        let user1 = await Level.findOneAndUpdate(
            { _id: request.body.id },
            request.body.updates,
            { new: true }
          );
          await Level.find({isDeleted:false},function(err,res){
            if(err){
                console.log(err)
            }else{
                return response.status(200).json({category:res});
            }})
    } catch (error) {
        
    }
   
   
}