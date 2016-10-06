'use strict'

const Q = require('q')
const R = require('ramda')
const expect = require('chai').expect
const libp2p = require('libp2p-ipfs')
const multiaddr = require('multiaddr')
const PeerId = require('peer-id')
const PeerInfo = require('peer-info')

const keys = require('./fixtures/keys').keys
const createPmesh = require('./../src/')
const { random } = require('./../src/utils')

const PORT = 12000
const TOTAL_NODES = 10
const PEER_CONNECTION_DELAY = 3000 // milliseconds

const noop = () => {}

describe(`Partial Mesh Topology:`, () => {
  let nodes

  let randA = random(0, TOTAL_NODES+1) // rand is min inclusive, max exclusive
  let randB = randA
  while (randB === randA) {
    randB = random(0, TOTAL_NODES+1)
  }

  before((done) => {
    nodes = R.map((idx) => {
      // Use pregenerated keys
      const privKey = keys[idx].privKey

      // Peer info
      const peerId = PeerId.createFromPrivKey(privKey)
      const peerInstance = new PeerInfo(peerId)
      const peerAddr1 = multiaddr(`/ip4/127.0.0.1/tcp/${PORT+idx}/ipfs/${peerInstance.id.toB58String()}`)
      peerInstance.multiaddr.add(peerAddr1)

      // Libp2p info
      const libp2pInstance = new libp2p.Node(peerInstance)

      // The network node instance
      return {
        peerInfo: peerInstance,
        libp2p: libp2pInstance,
        id: peerInstance.id.toB58String()
      }
    }, R.range(0, TOTAL_NODES))

    const starts = R.map((node) => node.libp2p.start(noop), nodes)

    return Q.allSettled(starts)
      .then(() => setTimeout(done, 3000))
  })

  // Close all connections at end of test
  after(() => {
    R.forEach((node) => {
      node.libp2p.swarm.close()
    }, nodes)
  })

  describe('fails:', () => {
    it('without nodes', () => {
      let thrower = () => createPmesh()
      expect(thrower).to.throw()
    })
  })

  describe('success:', () => {
    it('returns promise with connected nodes', (done) => {
      createPmesh(nodes).then((connected) => {
        // Must have this timeout for the connections to be established
        // And to allow the peerbooks to populate
        setTimeout(() => {
          // first node
          const nodeA = connected[randA]
          const idA = nodeA.peerInfo.id.toB58String()
          const peerBookA = nodeA.libp2p.peerBook.getAll()
          const peerCountA = R.keys(peerBookA).length

          // second node
          const nodeB = connected[randB]
          const idB = nodeB.peerInfo.id.toB58String()
          const peerBookB = nodeB.libp2p.peerBook.getAll()
          const peerCountB = R.keys(peerBookB).length

          expect(peerCountA >= 2).to.be.true
          expect(peerCountB >= 2).to.be.true
          done()
        }, PEER_CONNECTION_DELAY)
      })
    })
  })
})
