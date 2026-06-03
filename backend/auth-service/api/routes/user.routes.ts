import express from "express";

import User from "../models/user.model";

import {
  getUsers,
  getUserById,
} from "../controllers/user.controller";

const router = express.Router();

/*
========================================
GET ALL USERS
========================================
*/

router.get(
  "/",
  getUsers
);

/*
========================================
SEARCH USERS
========================================
*/

router.get(
  "/search",
  async (req, res) => {
    try {
      const query = String(
        req.query.q || ""
      ).toLowerCase();

      /*
========================================
EMPTY QUERY
========================================
*/

      if (!query.trim()) {
        return res.status(200).json({
          success: true,
          users: [],
        });
      }

      /*
========================================
SEARCH USERS
========================================
*/

      const users =
        await User.find({
          username: {
            $regex: query,
            $options: "i",
          },
        })
          .select(
            "username email"
          )
          .limit(10);

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.log(
        "SEARCH USERS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error",
      });
    }
  }
);

/*
========================================
GET USER BY ID
========================================
IMPORTANT:
KEEP THIS BELOW /search
========================================
*/

router.get(
  "/:id",
  getUserById
);

export default router;