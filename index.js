;(function () {

var raf = self.requestAnimationFrame
var cancelRaf = self.cancelAnimationFrame

var FORWARD = 1
var BACKWARD = -1

try {
  module.exports = Scrolltrigger
} catch (err) {
  self.Scrolltrigger = Scrolltrigger
}

function Scrolltrigger (container, axis) {
  var self = this

  self.container = container || window
  self.axis = axis || 'y'
  self.points = []
  self.immediatePreviousScroll = 0

  self.listen()
}

Scrolltrigger.loop = function loop (inst) {
  var container = inst.container
  var axis = inst.axis.toUpperCase()
  var scroll = container['scroll' + axis] || container['page' + axis + 'Offset']

  if (inst.immediatePreviousScroll !== scroll) {
    inst.points.forEach(function (point) {
      point.update(scroll)
    })
    inst.immediatePreviousScroll = scroll
  }

  return raf(function () {
    inst.requestId = loop(inst)
  })
}

Scrolltrigger.FORWARD = FORWARD
Scrolltrigger.BACKWARD = BACKWARD

Scrolltrigger.prototype.add = function (options) {
  var self = this
  var point = new Point(options, self.immediatePreviousScroll)
  self.points.push(point)

  return point
}

Scrolltrigger.prototype.remove = function (point) {
  var self = this
  var index = self.points.indexOf(point)
  self.points.splice(index, 1)
}

Scrolltrigger.prototype.refresh = function () {
  this.points.forEach(function (point) {
    point.refresh()
  })
}

Scrolltrigger.prototype.listen = function () {
  var self = this
  self.requestId = Scrolltrigger.loop(self)
  if (windowExists()) {
    self.resizeHandler = debounce(self.refresh.bind(self), 150)
    window.addEventListener('resize', self.resizeHandler)
  }
}

Scrolltrigger.prototype.stopListening = function () {
  var self = this
  cancelRaf(self.requestId)
  if (windowExists()) {
    window.removeEventListener('resize', self.resizeHandler)
  }
}

function Point (options, scroll) {
  var self = this

  self.previousScroll = scroll
  self.threshold = options.threshold
  self.callback = options.callback
  Object.assign(self, options)

  self.refresh()
}

Point.prototype.update = function (scroll) {
  var self = this
  var previous = self.previousScroll
  var current = scroll
  var threshold = self.__threshold
  var direction = current > previous ? FORWARD : BACKWARD

  // https://github.com/imakewebthings/waypoints/blob/master/src/context.js#L118
  var wasBeforeTriggerPoint = previous < threshold
  var nowAfterTriggerPoint = current >= threshold
  var crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint
  var crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint
  if (crossedForward || crossedBackward) {
    self.callback(direction, self)
  }

  self.previousScroll = scroll
}

Point.prototype.refresh = function () {
  var self = this
  self.__threshold = self.threshold()
}

function windowExists () {
  return typeof window !== 'undefined' && ('addEventListener' in window)
}

// thank you Remy Sharp
// https://remysharp.com/2010/07/21/throttling-function-calls
function debounce (fn, delay) {
  var timer = null

  return function () {
    var context = this
    var args = arguments
    clearTimeout(timer)
    timer = setTimeout(function () {
      fn.apply(context, args)
    }, delay)
  }
}

})()
