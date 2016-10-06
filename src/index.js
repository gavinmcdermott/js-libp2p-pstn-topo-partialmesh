'use strict'

const R = require('ramda')

const { log, resolveList, random } = require('./utils')
const { TopoError } = require('./errors')

const mapIndexed = R.addIndex(R.map)

const getPeersToFetch = (len, skipIdx, maxPeers) => {
  return R.map(() => {
    let idxToFetch = random(0, len)
    while (idxToFetch === skipIdx) {
      idxToFetch = random(0, len)
    }
    return idxToFetch
  }, R.range(0, maxPeers))
}

module.exports = (opts, nodes) => {
  const numPeerConns = 2

  if (R.isNil(nodes)) {
    nodes = opts
  }

  if (!R.isArrayLike(nodes)) {
    throw new TopoError(`Expect nodes to be <array>`)
  }
  const size = nodes.length

  const nestedPeerLinkFns = mapIndexed((fromNode, idx) => {
    const fromId = fromNode.peerInfo.id.toB58String()
    const linkPeerIds = getPeersToFetch(size, idx, numPeerConns)
    const linkPeers = R.map((idx) => nodes[idx], linkPeerIds)

    return R.map((toNode) => {
      const toId = toNode.peerInfo.id.toB58String()

      return new Promise((resolve, reject) => {
        fromNode.libp2p.dialByPeerInfo(toNode.peerInfo, (err) => {
          if (err) return reject(err)
          return resolve(fromNode)
        })
      })
    }, linkPeers)
  }, nodes)

  const linkFns = R.flatten(nestedPeerLinkFns)

  log('Initializing partial mesh topology')

  // return a promise with all connected nodes
  return resolveList(linkFns).then(() => nodes)
}
