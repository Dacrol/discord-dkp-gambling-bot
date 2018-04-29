const Discord = require("discord.io");
const fs = require("fs");
const table = require("text-table");
const Log = require("log");
const log = new Log(
  "debug" | "info" | "warning" | "error",
  fs.createWriteStream(`./log/${Date.now()}.log`)
);

/**
 *
 *
 * @class Botman
 */
module.exports = class Botman {
  constructor(authToken) {
    this.bot = new Discord.Client({
      token: authToken,
      autorun: true
    });
    this.bot.on("ready", evt => {
      log.info("Connecteds as " + this.bot.username + " (" + this.bot.id + ")");
      this.messageHandler();
    });
    fs.readFile("dkp.json", (err, data) => {
      if (err) throw err;
      this.dkpScores = JSON.parse(data);
    });
    this.maxDailyDKP = 100;
  }
  /**
   * registers everything that starts with !
   *
   * @memberof Botman
   */
  messageHandler() {
    this.bot.on("message", (user, userID, channelID, message, evt) => {
      if (!/^!/.test(message) || user == this.bot.username) return;
      let command = message.substring(1).split(" ")[0];
      const activeCommands = {
        roll: () => {
          this.getBestDkp();
          this.rollDice(user, channelID, message);
        },
        dkpp: () => {
          var exec = require("child_process").execFile;
          exec(`C:\\Program Files (x86)\\TeamViewer\\TeamViewer.exe`, function(
            err,
            data
          ) {
            log.error(err);
            log.error(data.toString());
          });
          this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
        },
        dkp: () => {
          this.dkpCommands(user, channelID, message);
        },
        default: () => {
          this.sendMessage(channelID, "```diff\n- Invalid command```", "red");
        }
      };
      typeof activeCommands[command] == "function"
        ? activeCommands[command]()
        : activeCommands["default"]();
    });
  }

  getBestDkp() {
    let bestScorer = { dkp: -900000 };
    for (let user of this.dkpScores.users) {
      if (bestScorer.dkp < user.dkp) {
        bestScorer = user;
      }
    }
    return bestScorer;
  }

  /**
   * sends messages
   *
   * @param {any} channelID - id of the channel to send to
   * @param {any} botMessage - the message
   * @param {string} [color="pink"] - the color for the embed, pink by def
   * @memberof Botman
   */
  sendMessage(channelID, botMessage, color = "pink") {
    let colors = {
      red: 16711680,
      green: 65280,
      blue: 255,
      pink: 16738740
    };
    color = colors[color];
    let botIconUrl =
      "https://cdn.discordapp.com/app-icons/430399909024497664/dedb8bfa775a4ba760872968e0dba46e.png";

    let embed = {
      title: null,
      description: botMessage,
      url: "",
      color: color,
      timestamp: new Date(),

      footer: {
        icon_url: botIconUrl,
        text: this.bot.username
      },
      fields: []
    };

    this.bot.sendMessage({
      to: channelID,
      embed: embed
    });
  }
  /**
   * basic !roll command 1-100
   *
   * @param {any} user - the user playing
   * @param {any} channelID - the channelID of where the commands was typed
   * @param {any} commands - the full command after !dkp
   * @memberof Botman
   */
  rollDice(user, channelID, message) {
    let roll = Math.floor(Math.random() * 100) + 1;
    let botMessage = `\`\`\`xl\n${user} rolled ${roll}\`\`\``;
    this.sendMessage(channelID, botMessage);
  }
  /**
   *  runs the methods depending on commands given
   *
   * @param {any} user - the user playing
   * @param {any} channelID - the channelID of where the commands was typed
   * @param {any} message - the full command (message)
   * @memberof Botman
   */
  dkpCommands(user, channelID, message) {
    let commands = message.split("!dkp ")[1];
    let command = message.split("!dkp ")[1];
    if (typeof commands != "undefined") {
      command = commands.split(" ")[0];
    }
    const activeCommands = {
      list: () => {
        this.dkpList(channelID);
      },
      dice: () => {
        this.dkpDice(user, channelID, commands);
      },
      give: () => {
        this.dkpAllotment(user, channelID, commands);
      },
      take: () => {
        this.dkpAllotment(user, channelID, commands);
      },
      default: () => {
        this.sendMessage(channelID, this.dkpCommandsTemplate());
      }
    };
    typeof activeCommands[command] == "function"
      ? activeCommands[command]()
      : activeCommands["default"]();
  }
  /**
   * prints the current users and their DKP
   *
   * @param {any} channelID - the channelID of where the commands was typed
   * @memberof Botman
   */
  dkpList(channelID) {
    let botMessage = "```css\n";
    let tableUsers = [["User", "DKP"]];
    for (let user of this.dkpScores.users) {
      tableUsers.push([user.username, user.dkp]);
    }
    botMessage += table(tableUsers, { align: ["l", "r"] }) + "```";
    this.sendMessage(channelID, botMessage);
  }
  /**
   * roll dice game of High/Low/7 (1/1/4*bet)
   *
   * @param {any} user - the user playing
   * @param {any} channelID - the channelID of where the commands was typed
   * @param {any} commands - the full command after !dkp
   * @memberof Botman
   */
  dkpDice(user, channelID, commands) {
    let users = this.dkpScores.users;
    let userIndex = this.dkpUserIndex(user);
    let amount = parseInt(commands.split(" ")[1]);
    let choice = commands.split(" ")[2];

    if (
      (choice == "high" ||
        choice == "h" ||
        choice == "low" ||
        choice == "l" ||
        choice == 7) &&
      users[userIndex].dkp >= amount
    ) {
      let msgColor = "green";
      users[userIndex].dkp -= amount;
      let diceOne = Math.floor(Math.random() * 6) + 1;
      let diceTwo = Math.floor(Math.random() * 6) + 1;
      let diceSum = diceOne + diceTwo;

      //custom emojis added ass :d1: :d2: etc. from img folder
      let diceMapping = [
        "<:d1:432210697318039552>",
        "<:d2:432210699427643393>",
        "<:d3:432210699540758543>",
        "<:d4:432210696902803467>",
        "<:d5:432210696965586954>",
        "<:d6:432210699264196625>"
      ];

      let botMessage = `You place a ${amount} DKP bet on ${
        choice == "h" || choice == "l"
          ? choice == "h"
            ? (choice = "high")
            : (choice = "low")
          : choice
      }\n\n`;
      botMessage += `${diceMapping[diceOne - 1]} on first dice\n${
        diceMapping[diceTwo - 1]
      } on second dice\n\nGiving you a totalt of ${diceSum}\n\n`;

      let winnings = 0;
      if (choice == 7 && diceSum == 7) {
        winnings = amount * 4;
        users[userIndex].dkp += winnings;
        botMessage += `Holy smokes, you just won ${winnings} DKP, `;
      } else if ((choice == "high" || choice == "h") && diceSum > 7) {
        winnings = amount * 2;
        users[userIndex].dkp += winnings;
        botMessage += `Sweet, you just won ${winnings} DKP, `;
      } else if ((choice == "low" || choice == "l") && diceSum < 7) {
        winnings = amount * 2;
        users[userIndex].dkp += winnings;
        botMessage += `Sweet, you just won ${winnings} DKP, `;
      } else {
        botMessage += "You loose your hard earned DKP, ";
        msgColor = "red";
      }
      botMessage += "setting your total to " + users[userIndex].dkp;
      this.sendMessage(channelID, botMessage, msgColor);
      this.dkpSave();
      log.notice(
        `${user} bet ${amount} on ${choice} and ${
          winnings > 1 ? "winning " + winnings : "loosing it"
        } (DKP:${users[userIndex].dkp})`
      );
    } else {
      if (users[userIndex].dkp <= amount)
        this.sendMessage(
          channelID,
          `\`\`\`diff\n- Not enough DKP, you have ${
            users[userIndex].dkp
          }\`\`\``,
          "red"
        );
      else
        this.sendMessage(
          channelID,
          `\`\`\`diff\n- Invalid command\`\`\``,
          "red"
        );
    }
  }
  /**
   * Checks if the username supplied is in our json
   * if not checks for the user on the server, and if
   * a matching username is found, we save the user to our
   * JSON and respond with the index, otherwise we return -1
   *
   * @param {any} username the username of the one we want the index for
   * @returns {number} index - -1 or the actual index
   * @memberof Botman
   */
  dkpUserIndex(username) {
    let users = this.dkpScores.users;
    let index = users.findIndex(user => user.username == username);
    //if current user is missing, check if he exist and save him
    if (index == -1) {
      for (let user in this.bot.users) {
        if (this.bot.users[user].username == username) {
          users.push({
            username: this.bot.users[user].username,
            id: this.bot.users[user].id,
            dkp: 0,
            bank: {
              lastUpdate: new Date(new Date().toJSON().split("T")[0]),
              dkp: 100
            }
          });
          index = users.length - 1;
          break;
        }
      }
    }
    return index;
  }
  /**
   * used to give or take DKP
   *
   * @param {any} currentUser the user that issued the command
   * @param {any} channelID the channelID of where the command was issued
   * @param {any} command should be all commands after "!dkp "
   * @memberof Botman
   */
  dkpAllotment(currentUser, channelID, command) {
    let botMessage;
    let modifier = command.split(" ")[0];
    let amount = parseInt(command.split(" ")[1]);
    let targetUser = command.split(" ")[2];
    let num = 3;
    while (command.split(" ")[num]) {
      targetUser += ` ${command.split(" ")[num]}`;
      num += 1;
    }

    if (amount > this.maxDailyDKP * 2) {
      botMessage = `\`\`\`diff\n- Too much DKP, max ${this.maxDailyDKP *
        2}\`\`\``;
      this.sendMessage(channelID, botMessage, "red");
      return;
    }

    if (targetUser == currentUser) {
      botMessage = `\`\`\`diff\n- That would be silly, you silly goose.\`\`\``;
      this.sendMessage(channelID, botMessage, "red");
      return;
    }

    let users = this.dkpScores.users;
    let targetUserIndex = this.dkpUserIndex(targetUser);
    let userIndex = this.dkpUserIndex(currentUser);
    let msgColor = "pink";
    if (targetUserIndex >= 0 && userIndex >= 0) {
      let now = new Date(new Date().toJSON().split("T")[0]);
      let then = new Date(
        new Date(users[userIndex].bank.lastUpdate).toJSON().split("T")[0]
      );

      if (Math.abs(now - then) >= 86400000) {
        let dkpToGive =
          currentUser == this.getBestDkp().username
            ? this.maxDailyDKP * 2
            : this.maxDailyDKP;
        users[userIndex].bank.dkp = dkpToGive;
        users[userIndex].bank.lastUpdate = now;
      }

      if (users[userIndex].bank.dkp >= amount) {
        users[userIndex].bank.dkp -= amount;
        if (modifier == "give") {
          users[targetUserIndex].dkp += amount;
          botMessage = `\`\`\`diff\n+ Gave ${amount} DKP to `;
        } else if (modifier == "take") {
          users[targetUserIndex].dkp -= Math.floor(amount / 2);
          botMessage = `\`\`\`diff\n+ Took ${Math.floor(amount / 2)} DKP from `;
        }
        botMessage += `${targetUser}, you now have ${
          users[userIndex].bank.dkp
        } more DKP to give or take today.\`\`\``;
        this.dkpSave();

        log.notice(
          `${currentUser} ${modifier} ${amount} to/from ${targetUser}`
        );
      } else {
        botMessage = `\`\`\`diff\n- Not enough DKP, you only have ${
          users[userIndex].bank.dkp
        }\`\`\``;
        msgColor = "red";
      }
    } else {
      botMessage = `\`\`\`diff\n- Did not find the username ${targetUser}\`\`\``;
      msgColor = "red";
    }
    this.sendMessage(channelID, botMessage, msgColor);
  }
  /**
   * Saves the current user data with DKP scores
   *
   * @memberof Botman
   */
  dkpSave() {
    let json = JSON.stringify(this.dkpScores);
    fs.writeFile("dkp.json", json, "utf8");
  }
  /**
   * Just a string template for the DKP commands to be called
   *
   * @returns {string} botMessage - the whole message as a string
   * @memberof Botman
   */
  dkpCommandsTemplate() {
    let botMessage =
      "Dragon Killing Master God is: <@" +
      this.getBestDkp().id +
      ">\n```diff\n" +
      "You can give and take a total of " +
      this.maxDailyDKP +
      " DKP every day.\nUnless you are top scorer, then it's " +
      this.maxDailyDKP * 2 +
      " DKP!" +
      "\n\ncommands:" +
      "\n!dkp - show dkp commands" +
      "\n!dkp list - list all users and their DKP" +
      "\n!dkp give <amount> <user> - give DKP to a user" +
      "\n!dkp take <amount> <user> - take DKP from a user (50% DR)" +
      "\n!dkp dice <amount> h/high/l/low/7 - feeling lucky?" +
      "\n\nexamples:" +
      "\n!dkp give 10 Tin" +
      "\n!dkp take 10 Tin" +
      "\n!dkp dice 50 l" +
      "\n!dkp dice 30 h" +
      "\n!dkp dice 50 7```";
    return botMessage;
  }
};