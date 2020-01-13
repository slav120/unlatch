const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const validator = require('validator')



module.exports = db => {
  
  /* GET Home Page. */
  router.get('/', function(req, res) {
    res.send('This is the home page')
  
  });

  /* POST Login. */
  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const text = `
      SELECT * FROM users
      WHERE email = $1 AND password = $2
    ;`;
    const values = [ email, password ];

    db.query(text, values)
    .then(data => {
        if (data.rows[0].length === 0) {
          res.send( { message: "You're not logged in!" });
        } 
        else {
          req.session.user_id = data.rows[0].id;
          res.send( { message: "Succesfully set session" })
        }
      })
      .catch(error => {
        if (error) {
        res.send( { message: "Incorrect Credentials"})
        }
      })
  });

  /* GET Register. */
  router.get('/register', (req, res) => {
    res.send('This is the register route')
  });

  const findEmail = function(email) {
    for (let user in users) {
      const currentUser = users[user];
      if (currentUser.email === email && validator.isEmail(email)) {
        return currentUser.email;
      }
    }
    return false;
  };

  const findPassword = function(password) {
    for (let user in users) {
      const currentUser = users[user];
      if (bcrypt.compareSync(password, currentUser.password)) {
        return currentUser.password;
      }
    }
    return false;
  };

  const findUsername = function(username) {
    for (let user in users) {
      const currentUser = users[user];
      if (currentUser.username === username) {
        return currentUser.username;
      }
    }
    return false;
  };

  const user = function({userObj}) {
    if (userObj) {
      return userObj;
    }
  };

  const authenticateUser = function(username, email, password) {
    const userEmail = findEmail(email);
    const userPassword = findPassword(password);
    const userUsername = findUsername(username);
    if ((userEmail || userUsername) && bcrypt.compareSync(password, userPassword.password)) {
      return [username, email, password];
    }
    return false;
  };



  /* POST Register. */
  router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const text = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id
    ;`;
    const values = authenticateUser(username, email, password);
    db.query(text, values)
      .then(data => {
        console.log(data)
        const userId = data.rows[0];
        req.session.user_id = userId;
        res.json( {username, email, password: bcrypt.hashSync(password, 10)} );
      })
      .catch(error => {
        console.log(`${error}`)
      });
  });

  /* GET Logout. */
  router.get('/logout', (req, res) => {
    req.session = null;
    res.send('This is the logout route')
  });

  // GET Users
  router.get('/users/:id', (req, res) => {
    const text = `
      SELECT * FROM users WHERE users.id = $1
    ;`;
    const values = [req.params.id]
    db.query(text, values)
      .then(result => {return res.json(result.rows)})
      .catch(err => console.log(`Error getting data: ${err.message}`))
  })
  

  /* POST Add Vehicle. */
  router.post('/vehicles', (req, res) => {
    if (!req.body) {
      res.status(400).json({ error: 'invalid request: no data in POST body'});
      return;
    }

    // extract content from the body of the request (req.body)
    const { make_id, vehicle_name, year} = req.body;
  

    getMakes()
      .then(makes => {
        // find out the make of the vehicle from extracted data
        let makeResult = makesCheck(makes, makeEntry);

        // ******* WHAT DO I DO WHEN THE MAKE DOESN'T EXIST ????? **************
        console.log(makeResult);
        console.log("GENERIC LABEL: ", makeResult);
        if (!makeResult) {
          makeResult = 'No such brand in'
        }

        // QUERY THAT CHECKS WHAT THE MAKES ID IS WHEN GIVEN THE MAKE NAME
        const text = `
        SELECT makes.id
        FROM makes
        WHERE makes.make_name LIKE $1
        `;
        const values = [makeResult];

        db.query(text, values)
          .then(data => {
            // - insert the todo in the database with the category
            const text = `
            INSERT INTO vehicles ()
            `;
          })
      });
  });

 /* GET Vehicles */
 router.get('/users/:id/vehicles', (req, res) => {
  const text = `
  SELECT users.id, make_id, model_id, year, picture_url, makes.make_name FROM users
  JOIN vehicles
  ON users.id = vehicles.user_id
  JOIN makes
  ON makes.id = vehicles.make_id
  WHERE users.id = $1
  ;`;
  const values = [ req.params.id ];
  db.query(text, values)
    .then(result => {return res.json(result.rows)})
    .catch(err => console.log(`Error getting data: ${err.message}`))
});

// GET MAKE 
router.get('users/:id/makes/:id', (req, res) => { 
  const text = 'SELECT * FROM makes WHERE id =$1;'; 
  const values = [req.params.id]; 
  
  db.query(text, values)
    .then(result => {return res.json(result.rows)})
    .catch(err => console.log(`Error getting data: ${err.message}`))
}); 

router.get('users/:id/makes/:id/models', (req,res) => {
  const text = `SELECT * FROM models WHERE make_id = $1;`;
  const values = [req.params.id];

  db.query(text, values)
  .then(result => {return res.json(result.rows)})
  .catch(err => console.log(`Error getting data: ${err.message}`))  
})

// GET MODEL 

router.get('users/:id/makes/:id/models/:model_id', (req, res) => { 
  const text = 'SELECT * FROM models WHERE id = $1 AND make_id = $2;'; 
  const values = [req.params.model_id, req.params.id];
  
  
  db.query(text, values)
    .then(result => { return res.json(result.rows)})
    .catch(err => console.log(`Error getting data: ${err.message}`))
})

  /* GET User Vehicle ID. */
  router.get('users/:id/vehicles/:vehicles_id', (req, res) => {
    
    const text = `
    SELECT * FROM vehicles
    WHERE vehicles.id = $1
    ;`;
    const values = [ req.params.vehicle_id ];

    db.query(text, values)
      .then(result => {
        console.log(values)
        return res.json(result.rows)})
      .catch(err => console.log(`Error getting data: ${err.message}`))
  });

  /* DELETE Vehicle ID. */
  router.delete("/vehicles/:vehicle_id", (req, res) => {
    const text = `
    DELETE FROM vehicles
    WHERE vehicles.id = $1
    ;`;
    const values = [ req.params.vehicle_id ];
    db.query(text, values)
    .then(data => {
      res.send( { message: "Vehicle Deleted" });
    })
    .catch(error => {
      console.log(`${error}`);
    })
  });

  /* GET Projects. */
  router.get('users/:id/vehicles/:vehicle_id/projects', (req, res) => {
    const text = `
      SELECT * FROM vehicles
      JOIN projects
      ON vehicles.id = projects.vehicle_id 
      WHERE vehicle_id = $1
      ;`;
    const values = [ req.params.vehicle_id ]
    db.query(text, values)
    .then(result => {
      res.json(result.rows)
      })
      .catch(err => console.log(`Error getting data: ${err.message}`))
  });

  /* GET New Project ID. */
  router.get('/vehicles/:vehicle_id/projects/:project_id', (req, res) => {
      const { project_id } = req.params;
      const query = {
        text: 'SELECT * FROM projects where id = $1',
        values: [project_id]
      };
      db
        .query(query)
        .then(result => res.json(result.rows))
        .catch(err => console.log(`Error getting data: ${err.message}`))
  });

  /* GET Notes. */
  router.get('/projects/:project_id/notes', (req, res) => {
    const { project_id } = req.params; 
    const query = { 
      text: 'SELECT * FROM projects JOIN notes ON notes.project_id = projects.id WHERE project_id = $1;',
      values: [project_id]
    };
    
     db 
       .query(query)
       .then(result => res.json(result.rows))
       .catch(err => console.log(`Error getting data: ${err.message}`))
  });


  /* GET Parts. */
  router.get('/projects/:project_id/parts', (req, res) => {
    const { project_id} = req.params; 
    const query = { 
      text: 'SELECT * FROM projects JOIN parts ON parts.project_id = projects.id WHERE project_id = $1;', 
      values: [project_id]
    };

    db 
      .query(query)
      .then(result => res.json(result.rows))
      .catch(err => console.log(`Error getting data: ${err.message}`))
  });

  /* GET Instructions. */
  router.get('/projects/:project_id/instructions', (req, res) => {
    const { project_id} = req.params; 
    const query = { 
      text: 'SELECT * FROM projects JOIN instructions ON instructions.project_id = projects.id WHERE project_id = $1;', 
      values: [project_id]
    };
    
    db 
    .query(query)
    .then(result => res.json(result.rows))
    .catch(err => console.log(`Error getting data: ${err.message}`))
  });

  /* GET Videos. */
  router.get('/projects/:project_id/videos', (req, res) => {
    const { project_id } = req.params;
    const query = {
      text: 'SELECT * FROM projects JOIN videos ON videos.project_id = projects.id WHERE project_id = $1;',
      values: [project_id]
    };
   
    db
      .query(query)
      .then(result => res.json(result.rows))
      .catch(err => console.log(`Error getting data: ${err.message}`))
  });

  return router;
};