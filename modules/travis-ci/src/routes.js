const
  crypto = require('crypto');

module.exports = robot => {

  robot.router.get('/webhooks/travis', (req, res) => {

    if (!req.body.payload) {
      res.json({error: 'Invalid payload.'});
      return;
    }

    if (!req.headers.signature) {
      res.json({error: 'Unsigned Request'});
      return;
    }

    const travisSignature = Buffer.from(req.headers.signature, 'base64');
    const payload = req.body.payload;

    robot.travis().config.get((err, ciRes) => {
      if (err) {
        res.json({error: 'Unable to get TravisCI public key.'});
        return;
      }
      const travisPublicKey = ciRes.config.notifications.webhook.public_key;

      const signed = crypto
        .createVerify('sha1')
        .update(payload)
        .verify(travisPublicKey, travisSignature);

      if (signed) {

        const type = ciRes.pull_request ? "Pull Request" : "Branch";

        let status, emoji;
        switch (ciRes.status_message) {
          case "Pending":
            emoji = "❕";
            status = "is pending 😀";
            break;
          case "Passed":
            emoji = "✅";
            status = "has passed 😀";
            break;
          case "Fixed":
            emoji = "✅";
            status = "is fixed 😀";
            break;
          case "Broken":
            emoji = "❌";
            status = "is broken 😟";
            break;
          case "Failed":
            emoji = "❌";
            status = "has failed 😟";
            break;
          case "Still Failing":
            emoji = "❌";
            status = "is still failing 😟";
            break;
          case "Canceled":
            emoji = "❕";
            status = "was canceled 😱";
            break;
          case "Errored":
            emoji = "❗";
            status = "has errored 😡";
            break;
          default:
            res.json({});
            return;
            break;
        }

        msg.send( `${emoji} Build ${ciRes.id} of ${type} ${ciRes.repository.name}#${ciRes.branch} by ${ciRes.author_name} ${status} ${ciRes.build_url}` );
        res.json({});
      }
    });
  });
};
