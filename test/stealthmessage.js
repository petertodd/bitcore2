var Keypair = require('../lib/keypair');
var StealthMessage = require('../lib/expmt/stealthmessage');
var Stealthkey = require('../lib/expmt/stealthkey');
var StealthAddress = require('../lib/expmt/stealthaddress');
var KDF = require('../lib/kdf');
var Hash = require('../lib/hash');
var should = require('chai').should();
var Address = require('../lib/address');

describe('StealthMessage', function() {

  var payloadKeypair = KDF.buf2keypair(new Buffer('key1'));
  var scanKeypair = KDF.buf2keypair(new Buffer('key2'));
  var fromKeypair = KDF.buf2keypair(new Buffer('key3'));
  var enchex = '3867dce7be22e8551512b25f329b51fd5fe8ecfe0381c7831a20c7c9ec88dcf092ea3683261798ccda991ed65a3a54a036d8125dec0381c7831a20c7c9ec88dcf092ea3683261798ccda991ed65a3a54a036d8125dec9f86d081884c7d659a2feaa0c55ad015aca97de5af3a34a0f47eee0a1f7774dcb759187555003282bd23b047bceb5b2f2c1ee35b8f0be1fda7a41424f6cc8030559c8c32ea8cc812860f4c8123f1417a';
  var encbuf = new Buffer(enchex, 'hex');
  var ivbuf = Hash.sha256(new Buffer('test')).slice(0, 128 / 8);
  var sk = Stealthkey().set({payloadKeypair: payloadKeypair, scanKeypair: scanKeypair});
  var sa = StealthAddress().fromStealthkey(sk);
  var messagebuf = new Buffer('this is my message');
  
  it('should make a new stealthmessage', function() {
    var sm = new StealthMessage();
    should.exist(sm);
    sm = StealthMessage()
    should.exist(sm);
  });

  it('should allow "set" style syntax', function() {
    var encbuf = StealthMessage().set({
      messagebuf: messagebuf,
      toStealthAddress: sa
    }).encrypt().encbuf;
    should.exist(encbuf);
    encbuf.length.should.equal(113);
  });

  describe('#set', function() {
    
    it('should set the messagebuf', function() {
      var sm = StealthMessage().set({messagebuf: messagebuf});
      should.exist(sm.messagebuf);
    });

  });

  describe('@encrypt', function() {

    it('should encrypt a message', function() {
      var encbuf = StealthMessage.encrypt(messagebuf, sa);
      encbuf.length.should.equal(166);
    });

    it('should encrypt a message with this fromKeypair and ivbuf the same each time', function() {
      var encbuf = StealthMessage.encrypt(messagebuf, sa, fromKeypair, ivbuf);
      encbuf.length.should.equal(166);
      encbuf.toString('hex').should.equal(enchex);
    });

  });

  describe('@decrypt', function() {

    it('should decrypt this known message correctly', function() {
      var messagebuf2 = StealthMessage.decrypt(encbuf, sk);
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'));
    });

  });

  describe('@isForMe', function() {

    it('should know that this message is for me', function() {
      StealthMessage.isForMe(encbuf, sk).should.equal(true);
    });

    it('should know that this message is for me even if my payloadPrivkey is not present', function() {
      var sk2 = new Stealthkey();
      sk2.scanKeypair = sk.scanKeypair;
      sk2.payloadKeypair = Keypair().set({pubkey: sk.payloadKeypair.pubkey});
      should.not.exist(sk2.payloadKeypair.privkey);
      StealthMessage.isForMe(encbuf, sk2).should.equal(true);
    });

  });

  describe('#encrypt', function() {
    
    it('should encrypt this message', function() {
      var sm = StealthMessage().set({
        messagebuf: messagebuf,
        toStealthAddress: sa,
        fromKeypair: fromKeypair
      });
      sm.encrypt().encbuf.length.should.equal(113);
    });

  });

  describe('#decrypt', function() {
    
    it('should decrypt that which was encrypted', function() {
      var sm = StealthMessage().set({
        messagebuf: messagebuf,
        toStealthAddress: sa
      }).encrypt();
      var messagebuf2 = StealthMessage().set({
        encbuf: sm.encbuf,
        fromKeypair: sm.fromKeypair,
        toStealthkey: sk
      }).decrypt().messagebuf;
      messagebuf2.toString('hex').should.equal(messagebuf.toString('hex'));
    });

  });

  describe('#isForMe', function() {
    
    it('should know that this message is for me', function() {
      StealthMessage().set({
        encbuf: encbuf,
        toStealthkey: sk,
        fromKeypair: fromKeypair,
        receiveAddress: Address().set({hashbuf: encbuf.slice(0, 20)})
      }).isForMe().should.equal(true);
    });

    it('should know that this message is not for me', function() {
      StealthMessage().set({
        encbuf: encbuf,
        toStealthkey: sk,
        fromKeypair: fromKeypair,
        receiveAddress: Address().set({hashbuf: encbuf.slice(0, 20)})
      }).isForMe().should.equal(true);
    });

  });

});
