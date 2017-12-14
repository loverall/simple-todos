import createIssue from 'github-create-issue'

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Tasks = new Mongo.Collection('tasks');

const opts = {
    'token': '51f09c6365a9a2e81686dae1fd86b5b31448ff96'
};
let issuenumber=null ,labels_url=null,repository_url=null,id=null,login=null;

if (Meteor.isServer) {
  // This code only runs on the server
  // Only publish tasks that are public or belong to the current user
  Meteor.publish('tasks', function tasksPublication() {
    return Tasks.find({
      $or: [
        { private: { $ne: true } },
        { owner: this.userId },
      ],
    });
  });
}
function clbk( error, issue, info ) {
     //Check for rate limit information... 
    if ( info ) {
        console.error( 'Limit: %d', info.limit );
        console.error( 'Remaining: %d', info.remaining );
        console.error( 'Reset: %s', (new Date( info.reset*1000 )).toISOString() );
        
    }
    if ( error ) {
        throw new Error( error.message );
    }
    issuenumber=issue.number;
    id=issue.id;
    labels_url=issue.labels_url;
    login=issue.login;
    repository_url=issue.repository_url;
    console.log( JSON.stringify( issue.number ) );
    console.log( JSON.stringify( issue) );
}
Meteor.methods({
  'tasks.insert'(text) {

    check(text, String);
createIssue( 'loverall/FSChallenge',text , opts, clbk );
console.log( issuenumber) 

    // Make sure the user is logged in before inserting a task
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
console.log(' this.userId');
console.log( this.userId);

//createIssue( 'loverall/FSChallenge',text , opts, clbk );

 if (issuenumber !== null) {
      text = text + ' this is the github issue ';
      Tasks.insert({
        text,
        issuenumber,
        id,
        login,
        repository_url,
        labels_url,
        createdAt: new Date(),
        owner: this.userId,
        username: Meteor.users.findOne(this.userId).username,
  
      });
    }
  },

  'tasks.remove'(taskId) {
    check(taskId, String);

    const task = Tasks.findOne(taskId);
    if (task.private && task.owner !== this.userId) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error('not-authorized');
    }

    Tasks.remove(taskId);
  },
  'tasks.setChecked'(taskId, setChecked) {
    check(taskId, String);
    check(setChecked, Boolean);

    const task = Tasks.findOne(taskId);
    if (task.private && task.owner !== this.userId) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, { $set: { checked: setChecked } });
  },
  'tasks.setPrivate'(taskId, setToPrivate) {
    check(taskId, String);
    check(setToPrivate, Boolean);

    const task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } });
  },
});
