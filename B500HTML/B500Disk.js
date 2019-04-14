//******************************************************************************
// B500Disk.js - Disk IO subsystem
//******************************************************************************


//------------------------------------------------------------------------------
// B500Disk
//------------------------------------------------------------------------------
function B500Disk
    (
    seg_size,			// segment size 120/240/480
    dsk_size,			// disk size BCD characters
    proc			// processor reference
    )
{
this.segment_size = seg_size ;
this.disk_size = dsk_size ;
this.processor = proc ;
this.memory = this.processor.memory ;
this.error = "" ;
this.disk = new Uint8Array (dsk_size) ;

} // B500Disk //

//------------------------------------------------------------------------------
// write
//------------------------------------------------------------------------------
B500Disk.prototype.write = function
    (
    segment ,
    segment_cnt ,
    memory_idx
    )
{
var ret =
    {
    milliseconds : 100
    } ;
var write_idx = segment * this.segment_size ;
var write_length = segment_cnt * this.segment_size ;
var mem_idx = memory_idx ;

//self.postMessage ({action:'alert','alert':"disk.write"}) ;
//self.postMessage ({action:'alert','alert':'seg:'+segment.toString()}) ;

this.error = "" ;

if ((mem_idx + write_length) > this.memory.length)
    {
    this.error = DISK_BAD_ADDRESS ;
    return (ret) ;
    }
if ((write_idx + write_length) > this.disk_size)
    {
    this.error = DISK_BAD_SEGMENT ;
    return (ret) ;
    }

while (write_length > 0)
    {
    this.disk [write_idx] = this.memory [mem_idx] ;
    write_length-- ;
    write_idx++ ;
    mem_idx++ ;
    }

ret.error = this.error ;
//self.postMessage ({action:'alert', 'alert':'disk.write err:' + this.error}) ;

return (ret) ;

} // write //

//------------------------------------------------------------------------------
// read
//------------------------------------------------------------------------------
B500Disk.prototype.read = function
    (
    segment ,
    segment_cnt ,
    mem_idx
    )
{
var ret =
    {
    milliseconds : 100
    } ;
var read_idx = segment * this.segment_size ;
var read_length = segment_cnt * this.segment_size ;
var mem_idx = memory_idx ;

//self.postMessage ({action:'alert','alert':
//'ri;' + read_idx.toString()
//+ ' rl:' + read_length.toString()
//+ ' mi:' + mem_idx.toString()
//}) ;

this.error = "" ;

if ((mem_idx + read_length) > this.memory.length)
    {
    this.error = DISK_BAD_ADDRESS ;
    return (ret) ;
    }
if ((read_idx + read_length) > this.disk_size)
    {
    this.error = DISK_BAD_SEGMENT ;
self.postMessage ({action:'alert','alert':
"diskread:ri:" + read_idx.toString()
}) ;
    return (ret) ;
    }

while (read_length > 0)
    {
    this.memory [mem_idx] = this.disk [read_idx] ;
    read_length-- ;
    read_idx++ ;
    mem_idx++ ;
    }

ret.error = this.error ;

return (ret) ;

} // read //

//------------------------------------------------------------------------------
// check
//------------------------------------------------------------------------------
B500Disk.prototype.check = function
    (
    segment ,
    segment_cnt
    )
{
var ret =
    {
    milliseconds : 100
    } ;
var read_idx = segment * this.segment_size ;
var read_length = segment_cnt * this.segment_size ;

this.error = "" ;

if ((read_idx + read_length) > this.disk_size)
    {
    this.error = DISK_BAD_SEGMENT ;
    }

ret.error = this.error ;

return (ret) ;

} // check //

//------------------------------------------------------------------------------
// interrogate
//------------------------------------------------------------------------------
B500Disk.prototype.interrogate = function ()
{

return (
    {
    error : this.error ,
    milliseconds : 100
    }) ;

} // interrogate //


