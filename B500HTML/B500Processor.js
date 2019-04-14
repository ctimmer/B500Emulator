/*------------------------------------------------------------------------------
** B500Processor.js 
**------------------------------------------------------------------------------
**
** Operations implemented (and lightly tested)
**
**   Arithmatic Instructions
** ADD
** SUBTRACT
** MULTIPLY
** DIVIDE
**
**   Control Instructions
** ADDRESS MODIFICATION
** COMPARE EQUAL
** COMPARE UNEQUAL
** BRANCH
** NO-OPERATION
** HALT AND BRANCH
**
**   Editing Instructions
** TRANSFER
** TRANSFER ZONE
** DATA COMPRESS - untested
** DATA EXPAND - untested
** MASK - mostly complete
**
**   Card input/output instructions (yes)
**   Print output instructions (yes)
**   Sorter Reader instructions (probably not)
**   Magnetic Tape instructions (yes)
**   Paper Tape instructions (? same as mag tape, almost)
**   Disk File instructions (yes)
** DISK FILE WRITE
** DISK FILE READ
**   Data Communication instructions (maybe)
**
**------------------------------------------------------------------------------
**
*/

importScripts ('./B500Disk.js') ;

"use strict"

const DEBUG = true ;
const memory_size = 19200 ;
const ASCII_GEQ = 'g' ;
const ASCII_LEQ = 'l' ;
const ASCII_NEQ = 'n' ;
const GROUP_MARK = 't' ;
const instruction_length = 12 ;
const section_length = 120 ;
const field_length = 12 ;
const BCD_CHAR = 0x3f ;
const BCD_ZONE = 0x30 ;
const BCD_NUMERIC = 0x0f ;
const CONDITION_OFF = 0x00 ;
const CONDITION_EQUAL = 0x01 ;
const CONDITION_LOW = 0x02 ;
const CONDITION_HIGH = 0x04 ;
const CONDITION_UNEQUAL = (CONDITION_LOW | CONDITION_HIGH) ;
const DEFAULT_INSTRUCTION_MICROSECONDS = 100 ;

const DISK_NOT_READY = "notready" ;
const DISK_BAD_SEGMENT = "badsegment" ;
const DISK_BAD_ADDRESS = "notready" ;


//------------------------------------------------------------------------------
// B500Processor
//------------------------------------------------------------------------------
function B500Processor ()
{
this.test_program
    = "61 K50      AAAAAAAAAAAABBBBBBBBBBBBCCCCCCCCCCCCDDDDDDDDDDDD"
    + "EEEEEEEEEEEEFFFFFFFFFFFFGGGGGGGGGGGGHHHHHHHHHHHHIIIIIIIIIIII"                   
    + "JJJJJJJJJJJJKKKKKKKKKKKKLLLLLLLLLLLLMMMMMMMMMMMMNNNNNNNNNNNN"                   
    + "PPPPPPPPPPPPQQQQQQQQQQQQRRRRRRRRRRRRSSSSSSSSSSSSTTTTTTTTTTTT"                   
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    + "                                                            "                    
    //+ "            $+-&$+-&$+-&00024000000000000000210000000       "                   
    + "            $+-&$+-&$+-&00024000000000000100010000000       "                   
    + "707K27   K3#K8 O50O70O90707K3#   010707K3#   190701K39   L02"                   
    + "K01K3#010O90701K39   L22K41K3#   O90703L36L50M7361 M80      "                   
    + "527K3#K32L6060 K60K60L70707K27   K3#K8 O50O70O90K21K3#x10O90"                   
    + "547x10K3#N30 47K00K3#N30703M26M40M7361 M80      527K3#K32M50"                   
    + "60 L80L80M60999M70      61 M80      561K39P30N10127P31K3#K3#"                   
    + "61 M70      117K39K3#K3#61 M70                  991N40      "                    
    + "            992N60                  993N80                  "                   
    + "994O00                  991O20                  991O40      "                   
    + "            991O60                  991O80                  "                    
    + "991P00                  991P20      010                     "           
    ;

this.console_message = {} ;

this.memory = new Uint8Array (memory_size).fill (BCD_ZONE) ;
this.processor_halt = false ;
this.processor_fault = false ;
this.io_pending = "" ;
this.single_instruction = false ;
this.memory_display_idx = 0 ;
this.wait = 0 ;
this.sense_switches =
    {
    'sense_switch_6':false ,
    'sense_switch_5':false ,
    'sense_switch_4':false ,
    'sense_switch_3':false ,
    'sense_switch_2':false ,
    'sense_switch_1':false 
    } ;

this.conditional = CONDITION_OFF ;
this.instruction_idx = 0 ;
this.instruction_idx_next = 0 ;
this.current_instruction =      // Used by op handlers
    {
    address: [] ,
    op: ' ' ,
    m: ' ' ,
    n: ' ' ,
    aaa: [] ,
    bbb: [] ,
    ccc: [] ,
    microseconds: 0
    } ;
this.bcd =
    [
    {ascii: "0", seq: 0x30} ,              // 0x00
    {ascii: "1", seq: 0x31} ,
    {ascii: "2", seq: 0x32} ,
    {ascii: "3", seq: 0x33} ,
    {ascii: "4", seq: 0x34} ,
    {ascii: "5", seq: 0x35} ,
    {ascii: "6", seq: 0x36} ,
    {ascii: "7", seq: 0x37} ,
    {ascii: "8", seq: 0x38} ,
    {ascii: "9", seq: 0x39} ,
    {ascii: "#", seq: 0x3a} ,
    {ascii: "@", seq: 0x3b} ,
    {ascii: "?", seq: 0x3c} ,
    {ascii: ":", seq: 0x3d} ,
    {ascii: ">", seq: 0x3e} ,
    {ascii: ASCII_GEQ, seq: 0x3f} ,
    {ascii: "+", seq: 0x00} ,              // 0x10
    {ascii: "A", seq: 0x01} ,
    {ascii: "B", seq: 0x02} ,
    {ascii: "C", seq: 0x03} ,
    {ascii: "D", seq: 0x04} ,
    {ascii: "E", seq: 0x05} ,
    {ascii: "F", seq: 0x06} ,
    {ascii: "G", seq: 0x07} ,
    {ascii: "H", seq: 0x08} ,
    {ascii: "I", seq: 0x09} ,
    {ascii: ".", seq: 0x0a} ,
    {ascii: "[", seq: 0x0b} ,
    {ascii: "&", seq: 0x0c} ,
    {ascii: "(", seq: 0x0d} ,
    {ascii: "<", seq: 0x0e} ,
    {ascii: GROUP_MARK, seq: 0x0f} ,   // control <-
    {ascii: "x", seq: 0x10} ,          // Control  0x20        
    {ascii: "J", seq: 0x11} ,
    {ascii: "K", seq: 0x12} ,
    {ascii: "L", seq: 0x13} ,
    {ascii: "M", seq: 0x14} ,
    {ascii: "N", seq: 0x15} ,
    {ascii: "O", seq: 0x16} ,
    {ascii: "P", seq: 0x17} ,
    {ascii: "Q", seq: 0x18} ,
    {ascii: "R", seq: 0x19} ,
    {ascii: "$", seq: 0x1a} ,
    {ascii: "*", seq: 0x1b} ,
    {ascii: "-", seq: 0x1c} ,
    {ascii: ")", seq: 0x1d} ,
    {ascii: ";", seq: 0x1e} ,
    {ascii: ASCII_LEQ, seq: 0x1f} ,
    {ascii: " ", seq: 0x20} ,              // 0x30
    {ascii: "/", seq: 0x21} ,
    {ascii: "S", seq: 0x22} ,
    {ascii: "T", seq: 0x23} ,
    {ascii: "U", seq: 0x24} ,
    {ascii: "V", seq: 0x25} ,
    {ascii: "W", seq: 0x26} ,
    {ascii: "X", seq: 0x27} ,
    {ascii: "Y", seq: 0x28} ,
    {ascii: "Z", seq: 0x29} ,
    {ascii: ",", seq: 0x2a} ,
    {ascii: "%", seq: 0x2b} ,
    {ascii: ASCII_NEQ, seq: 0x2c} ,
    {ascii: "=", seq: 0x2d} ,
    {ascii: "]", seq: 0x2e} ,
    {ascii: '"', seq: 0x2f}    // Double quote
    ] ;
this.ascii_to_bcd = new Uint8Array (64) ;    // Built in initialize

this.disk = new B500Disk
    (
    240 ,			// Segment size (120,240,480)
    240000 ,			// Disk character size
    this			// My processor reference
    ) ;

this.initialize () ;

} // B500Processor //

//------------------------------------------------------------------------------
// initialize
//------------------------------------------------------------------------------
B500Processor.prototype.initialize = function ()
{
let idx ;

this.console_initialize () ;
this.update_power_on_light (true) ;
this.update_halt_light (true) ;

for (idx = 0 ; idx < this.bcd.length ; idx++)
    {
    this.ascii_to_bcd[this.bcd[idx]['ascii']] = idx ;
    }
for (idx = 0 ; idx < memory_size ; idx++)
    {
    this.memory [idx] = this.ascii_to_bcd [' '] ;
    }

for (idx = 0 ; idx < 64 ; idx++)
    {
    this.bcd [idx].op_function
		= this.invalid_operation.bind (this) ; // Init ops to all bad
    }

this.bcd [0x00].op_function = this.nop_operation.bind (this) ;      // "0"
this.bcd [0x01].op_function = this.add_operation.bind (this) ;      // "1"
this.bcd [0x02].op_function = this.subtract_operation.bind (this) ; // "2"
this.bcd [0x03].op_function = this.multiply_operation.bind (this) ; // "3"
this.bcd [0x04].op_function = this.divide_operation.bind (this) ;   // "4"
this.bcd [0x05].op_function = this.compare_operation.bind (this) ;  // "5"
this.bcd [0x06].op_function = this.branch_operation.bind (this) ;   // "6"
this.bcd [0x07].op_function = this.transfer_operation.bind (this) ; // "7"
this.bcd [0x08].op_function = this.mask_operation.bind (this) ;     // "8"
this.bcd [0x09].op_function = this.halt_operation.bind (this) ;     // "9"
this.bcd [0x0A].op_function = this.card_read_operation.bind (this) ; // "#"
this.bcd [0x11].op_function = this.print_operation.bind (this) ;	// "A"
this.bcd [0x21].op_function = this.address_modify_operation.bind (this) ; // "J"
this.bcd [0x22].op_function = this.disk_operation.bind (this) ;	    // "K"
this.bcd [0x24].op_function = this.data_compress_operation.bind (this) ; // "M"
this.bcd [0x25].op_function = this.data_expand_operation.bind (this) ; // "N"
this.bcd [0x27].op_function = this.transfer_zone_operation.bind (this) ; // "P"
this.bcd [0x28].op_function = this.spo_operation.bind (this) ; 		// "Q"
this.bcd [0x30].op_function = this.nop_operation.bind (this) ;		// " "
this.bcd [0x33].op_function = this.interrogate_operation.bind (this) ; // "T"

this.import_ascii (this.test_program ,
		    this.index_to_address (0) ,
		    this.test_program.length) ;
this.run_next = this.next_instruction.bind (this) ; 
//this.import_ascii (" 12111222333999000      " ,
//		    this.index_to_address (0) ,
//		    24) ;

this.clear_button () ;
this.console_refresh () ;

} // initialize //

//------------------------------------------------------------------------------
// console_initialize
//------------------------------------------------------------------------------
B500Processor.prototype.console_initialize = function ()
{
let init = {'action':'console_update' ,
	    'updates': []} ;
this.console_message = init ;

} // console_initialize //

//------------------------------------------------------------------------------
// console_refresh
//------------------------------------------------------------------------------
B500Processor.prototype.console_refresh = function ()
{
if (this.console_message.updates.length > 0)
    {
    self.postMessage (this.console_message) ;
    }
 
this.console_initialize () ;

} // console_refresh //

//------------------------------------------------------------------------------
// console_update
//------------------------------------------------------------------------------
B500Processor.prototype.console_update = function
    (
    panel_data ,
    refresh
    )
{

this.console_message.updates.push (panel_data) ;

if (refresh)
    {
    this.console_refresh () ;
    }

} // console_update //

//------------------------------------------------------------------------------
// instruction_display - display op, m variant, n variant
//------------------------------------------------------------------------------
B500Processor.prototype.instruction_display = function (instruction)
{

this.console_update ({'id':'instruction_display',
		    'value':instruction});

} // instruction_display //

//------------------------------------------------------------------------------
// memory_data_display - display memory data on panel
//------------------------------------------------------------------------------
B500Processor.prototype.memory_data_display = function (address)
{
let memory_slice ;
let bit_idx ;
let parity_bit = 1 ;	    // Start at odd

this.memory_display_idx = this.address_to_index (address) ;
memory_slice = this.memory.slice (this.memory_display_idx,
				    this.memory_display_idx + 1) ;
for (bit_idx = 0 ; bit_idx < 6 ; bit_idx++)	// add up bits
    {
    parity_bit += (memory_slice[0] >>> bit_idx) & 0x01 ;
    }
memory_slice[0] |= (parity_bit & 0x01) << 6 ;	// add parity bit

this.console_update ({"id":'memory_data_display',
		    "value":memory_slice});

} // memory_data_display //

//------------------------------------------------------------------------------
// memory_address_display - display memory address on panel
//------------------------------------------------------------------------------
B500Processor.prototype.memory_address_display = function (address)
{

this.console_update ({"id":'memory_address_display',
		    "value":address});

} // memory_address_display //

//------------------------------------------------------------------------------
// instruction_address_display - display instruction address on panel
//------------------------------------------------------------------------------
B500Processor.prototype.instruction_address_display = function (address)
{

this.console_update ({"id":'instruction_address_display',
		    "value":address});

} // instruction_address_display //

//------------------------------------------------------------------------------
// update_power_on_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_power_on_light = function (light_on)
{

this.console_update ({'id':'power_on_light',
			"value":light_on} ,
		    true);

} // update_power_on_light //

//------------------------------------------------------------------------------
// update_continue_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_continue_light = function (light_on)
{

this.console_update ({'id':'continue_light',
			"value":light_on} ,
		    true);

} // update_continue_light //

//------------------------------------------------------------------------------
// update_halt_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_halt_light = function (light_on)
{

this.console_update ({'id':'halt_light',
			"value":light_on} ,
		    true);

} // update_halt_light //

//------------------------------------------------------------------------------
// update_central_processor_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_central_processor_light = function (light_on)
{

this.console_update ({'id':'central_processor_light',
			"value":light_on} ,
		    true);

} // update_central_processor_light //

//------------------------------------------------------------------------------
// update_indicator_light
//------------------------------------------------------------------------------
B500Processor.prototype.update_indicator_light = function
    (
    indicator ,
    light_on
    )
{

this.console_update ({'id':indicator,
			"value":light_on} ,
		    true);

} // update_indicator_light //

//------------------------------------------------------------------------------
// set_conditional
//------------------------------------------------------------------------------
B500Processor.prototype.set_conditional = function
    (val)		// <0 low, >0 high, otherwise equal
{

if (val < 0)
    {
    this.conditional = CONDITION_LOW ;
    }
else if (val > 0)
    {
    this.conditional = CONDITION_HIGH ;
    }
else
    {
    this.conditional = CONDITION_EQUAL ;
    }

} // set_conditional //

//------------------------------------------------------------------------------
// set_next_instruction
//------------------------------------------------------------------------------
B500Processor.prototype.set_next_instruction = function
    (addr)		// address of next instruction
{

this.instruction_idx_next = this.address_to_index (addr) ;

} // set_next_instruction //

//------------------------------------------------------------------------------
// index_to_address
//------------------------------------------------------------------------------
B500Processor.prototype.index_to_address = function (idx)
{
let section = 0x00 ;
let field = 0x00 ;
let character = 0x00 ;
let idx_mod_4800 ;
let test_val ;
let address ;

idx_mod_4800 = idx % 4800 ;

test_val = Math.floor (idx_mod_4800 / 1200) ;
section |= (test_val << 4) & BCD_ZONE ;
test_val = Math.floor ((idx_mod_4800 % 1200) / 120) ;
section |= test_val & 0x0F ;

test_val = Math.floor (((idx_mod_4800 % 1200) % 120) / 12) ;
field |= test_val & 0x0F ;
if (idx >= 9600)
    {
    field |= 0x10 ;
    }
if ((idx % 9600) >= 4800)
    {
    field |= 0x20 ;
    }

character = (idx % 12) ;

address = new Uint8Array ([section, field, character]) ;

return (address) ;

} // index_to_address //

//------------------------------------------------------------------------------
// address_to_index
//------------------------------------------------------------------------------
B500Processor.prototype.address_to_index = function (address)
{
let section = address [0] & 0x3F ;
let field = address [1] & 0x3F ;
let character = address [2] & 0x3F ;
let idx = 0 ;

if ((section & 0x0F) > 9)
    {
    return (-1) ;
    }
if ((field & 0x0F) > 9)
    {
    return (-1) ;
    }
if ((character & 0x0F) > 11)
    {
    return (-1) ;
    }

idx += ((section & BCD_ZONE) >>> 4) * (1200) ;
idx += (section & 0x0F) * 120 ;

if (field & 0x20)                       // field B bit
    {
    idx += (section_length * 40) ;      // 4800+
    }
if (field & 0x10)                       // field A bit
    {
    idx += (section_length * 80) ;      // 9600+
    }
idx += (field & 0x0F) * 12 ;

idx += (character & 0x0F) ;             // Characters

if (idx >= this.memory_size)
    {
    return (-1) ;
    }

return (idx) ;                          // Computed memory index

} // address_to_index //

//------------------------------------------------------------------------------
// bcd_to_integer
//------------------------------------------------------------------------------
B500Processor.prototype.bcd_to_integer = function
    (
    addr ,
    bcd_length
    )
{
let int_ret = 0 ;
let mem_idx = this.address_to_index (addr) ;
let bcd_count ;

if (bcd_length <= 0)
    {
    return (int_ret) ;
    }

for (bcd_count = 0 ; bcd_count < bcd_length ; bcd_count++)
    {
    int_ret *= 10 ;
    int_ret += this.memory [mem_idx] & BCD_NUMERIC ;
    mem_idx++ ;
    }
if (this.memory [mem_idx - 1] & 0x20)		// B bit sign
    {
    int_ret *= -1 ;
    }

return (int_ret) ;

} // bcd_to_integer //

//------------------------------------------------------------------------------
// integer_to_bcd
//------------------------------------------------------------------------------
B500Processor.prototype.integer_to_bcd = function
    (
    int_in ,
    addr ,
    bcd_length
    )
{
let int_work = Math.abs (int_in) ;
let mem_idx = (this.address_to_index (addr) + bcd_length) - 1 ;
let bcd_count ;

for (bcd_count = 0 ; bcd_count < bcd_length ; bcd_count++)
    {
    this.memory [mem_idx] = (int_work % 10) & BCD_NUMERIC ;
    int_work = Math.floor (int_work / 10) ;
    mem_idx-- ;
    }

if (int_in < 0)
    {
    this.memory [(mem_idx + bcd_length)] |= 0x20 ;
    }

} // integer_to_bcd //

//------------------------------------------------------------------------------
// compare_characters
//------------------------------------------------------------------------------
B500Processor.prototype.compare_characters = function
    (
    from_addr ,
    to_addr ,
    comp_length ,
    bit_pattern		// 0x3f - char, 0x0f - num, 0x30 - zone
    )
{
let from_idx = this.address_to_index (from_addr) ;
let to_idx = this.address_to_index (to_addr) ;
let comp_count ;
let comp_result = 0 ;

//self.postMessage ({action:'alert','alert':'compare_characters:entry'}) ;
//this.mem_dump_message (from_addr, comp_length) ;
//this.mem_dump_message (to_addr, comp_length) ;

for (comp_count = 0 ; comp_count < comp_length ; comp_count++)
    {
    comp_result = (this.bcd [this.memory [from_idx] & BCD_CHAR].seq & bit_pattern)
    		- (this.bcd [this.memory [to_idx] & BCD_CHAR].seq & bit_pattern) ;
//self.postMessage ({action:'alert','alert':'comp_result:' + comp_result.toString()}) ;
    if (comp_result != 0)
	{
	break ;		// not equal
	}
    to_idx++ ;
    from_idx++ ;
    }

this.set_conditional (comp_result) ;
//self.postMessage ({action:'alert','alert':'compare_characters:exit:' + comp_result.toString()}) ;

} // compare_characters //

//------------------------------------------------------------------------------
// transfer_characters
//------------------------------------------------------------------------------
B500Processor.prototype.transfer_characters = function
    (
    from_addr ,
    to_addr ,
    xfer_length ,
    bit_pattern
    )
{
let from_idx = this.address_to_index (from_addr) ;
let to_idx = this.address_to_index (to_addr) ;

for ( ; xfer_length > 0 ; xfer_length--)
    {
    //this.memory [to_idx] = this.memory [from_idx] ;
    this.memory [to_idx]
	= (this.memory [to_idx] & (! bit_pattern))
	| (this.memory [from_idx] & bit_pattern) ;
    to_idx++ ;
    from_idx++ ;
    }

return (xfer_length) ;

} // transfer_characters //

//------------------------------------------------------------------------------
// import_ascii
//------------------------------------------------------------------------------
B500Processor.prototype.import_ascii = function
    (
    from_text ,
    to_addr ,
    xfer_length
    )
{
let to_idx = this.address_to_index (to_addr) ;
let from_idx = 0 ;

for ( ; xfer_length > 0 ; xfer_length--)
    {
    this.memory [to_idx] = this.ascii_to_bcd [from_text [from_idx]] ;
    to_idx++ ;
    from_idx++ ;
    }

return (xfer_length) ;

} // import_ascii //

//------------------------------------------------------------------------------
// increase_address_and_read_button
//------------------------------------------------------------------------------
B500Processor.prototype.increase_address_and_read_button = function ()
{
let mem_idx = this.memory_display_idx += 1 ;
let mem_addr ;

if (mem_idx >= this.memory_size)
    {
    mem_idx = 0 ;
    }

mem_addr = this.index_to_address (mem_idx) ;
this.memory_address_display (mem_addr) ;
this.memory_data_display (mem_addr) ;

this.console_refresh () ;

} // increase_address_and_read_button //

//------------------------------------------------------------------------------
// toggle_sense_switch
//------------------------------------------------------------------------------
B500Processor.prototype.toggle_sense_switch = function (switch_id)
{

this.sense_switches[switch_id] = ! this.sense_switches[switch_id] ;

this.console_update ({'id':switch_id + '_light',
			'value':this.sense_switches[switch_id]} ,
		    true);

} // toggle_sense_switch //

//------------------------------------------------------------------------------
// LOAD button
//------------------------------------------------------------------------------
B500Processor.prototype.load_button = function ()
{

} // load_button //

//------------------------------------------------------------------------------
// SINGLE INST button
//------------------------------------------------------------------------------
B500Processor.prototype.single_inst_button = function ()
{

this.single_instruction = true ;
this.processor_halt = false ;
this.run () ;

} // single_inst_button //

//------------------------------------------------------------------------------
// CLEAR button
//------------------------------------------------------------------------------
B500Processor.prototype.clear_button = function ()
{
let addr ;

this.processor_halt = true ;
this.single_instruction = false ;
this.instruction_idx = 0 ;
this.instruction_idx_next = 0 ;

addr = this.index_to_address (this.instruction_idx) ;
this.instruction_display 
    (this.memory.slice (this.instruction_idx, this.instruction_idx + 3)) ;
this.memory_data_display (addr) ;
this.memory_address_display (addr) ;
this.instruction_address_display (addr) ;

this.console_refresh () ;

} // clear_button //

//------------------------------------------------------------------------------
// HALT button
//------------------------------------------------------------------------------
B500Processor.prototype.halt_button = function ()
{

this.processor_halt = true ;

} // halt_button //

//------------------------------------------------------------------------------
// CONTINUE button
//------------------------------------------------------------------------------
B500Processor.prototype.continue_button = function ()
{

this.processor_halt = false ;
this.single_instruction = false ;
this.update_halt_light (false) ;
this.update_continue_light (true) ;
this.update_central_processor_light (true) ;

this.run () ;

} // continue_button //

//------------------------------------------------------------------------------
// next_instruction
//------------------------------------------------------------------------------
B500Processor.prototype.next_instruction = function ()
{

this.wait = 0 ;

this.run () ;

} // next_instruction //

//------------------------------------------------------------------------------
// enter_wait
//------------------------------------------------------------------------------
B500Processor.prototype.enter_wait = function ()
{

this.wait = 0 ;

this.update_halt_light (true) ;
this.update_continue_light (false) ;
this.update_central_processor_light (false) ;

} // enter_wait //

//##############################################################################
// Instruction handlers
//##############################################################################

//------------------------------------------------------------------------------
// run
//------------------------------------------------------------------------------
B500Processor.prototype.run = function ()
{

//self.postMessage ({'action':'alert', 'alert':'run>enter'}) ;
if (this.wait > 0)
    {
//self.postMessage ({'action':'alert', 'alert':'run>Already running'}) ;
    return ;				// Already running
    }
this.wait = 5 ;

if (this.processor_halt)
    {
    this.enter_wait () ;
    return ;
    }

this.update_central_processor_light (true) ;
this.instruction_idx = this.instruction_idx_next ;          // New current instruction
this.instruction_idx_next = this.instruction_idx + instruction_length ;

this.current_instruction.address = this.index_to_address (this.instruction_idx) ; 
this.current_instruction.op = this.memory [this.instruction_idx] ;   // op
this.current_instruction.m = this.memory [this.instruction_idx + 1] ; // m
this.current_instruction.n = this.memory [this.instruction_idx + 2] ; // n
this.current_instruction.aaa                                         // AAA
    = this.memory.slice (this.instruction_idx + 3, this.instruction_idx + 6) ;
this.current_instruction.bbb                                         // BBB
    = this.memory.slice (this.instruction_idx + 6, this.instruction_idx + 9) ;
this.current_instruction.ccc                                         // CCC
    = this.memory.slice (this.instruction_idx + 9, this.instruction_idx + 12) ;
this.instruction_display (this.memory.slice (this.instruction_idx,
					    this.instruction_idx + 3)) ;
this.instruction_address_display (this.current_instruction.address) ;
this.memory_address_display (this.current_instruction.address) ;
this.memory_data_display (this.current_instruction.address) ;
this.console_refresh () ;

this.current_instruction.microseconds = 0 ;	// execution time us
this.bcd [this.current_instruction.op].op_function () ;

if (this.io_pending)
    {
    return ;
    }
if (this.single_instruction)
    {
    this.enter_wait () ;
    return ;
    }

setTimeout (this.run_next, this.wait) ;

} // run //

//------------------------------------------------------------------------------
// add_operation
//------------------------------------------------------------------------------
B500Processor.prototype.add_operation = function ()
{
let addend_length = this.current_instruction.m & BCD_NUMERIC ;
let augend_length = this.current_instruction.n & BCD_NUMERIC ;
let addend ;
let augend ;
let sum ;

if (addend_length <= 0)
    {
    addend_length = 12 ;
    }
addend = this.bcd_to_integer (this.current_instruction.aaa,
				addend_length) ;
if (augend_length <= 0)
    {
    augend_length = 12 ;
    }
augend = this.bcd_to_integer (this.current_instruction.bbb,
				augend_length) ;

//self.postMessage ({action:'alert','alert':'add_operation:entry'}) ;
//this.mem_dump_message (this.current_instruction.aaa, addend_length) ;
//this.mem_dump_message (this.current_instruction.bbb, augend_length) ;

sum = augend + addend ;

this.integer_to_bcd (sum ,
			this.current_instruction.ccc,
			Math.max (addend_length, augend_length)) ;

this.set_conditional (sum) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;
//this.mem_dump_message (this.current_instruction.ccc, Math.max (addend_length, augend_length)) ;
//self.postMessage ({action:'alert','alert':'add_operation:exit'}) ;

} // add_operation //

//------------------------------------------------------------------------------
// address_modify_operation
//------------------------------------------------------------------------------
B500Processor.prototype.address_modify_operation = function ()
{
let increment ;
let addr_idx ;
let mod_addr ;
let mod_addr_idx ;

increment = (((this.current_instruction.aaa[0] & BCD_NUMERIC) * 10)
            + (this.current_instruction.aaa[1] & BCD_NUMERIC)) * 12
            + (this.current_instruction.aaa[2] & BCD_NUMERIC) ;
if (increment == 0)
    {
    increment = 1200 ;
    }

addr_idx = this.address_to_index (this.current_instruction.bbb) ;
mod_addr = 
    [
    this.memory [addr_idx] ,
    this.memory [addr_idx + 1] ,
    this.memory [addr_idx + 2]
    ] ;
mod_addr_idx = this.address_to_index (mod_addr) + increment ;
mod_addr  = this.index_to_address (mod_addr_idx) ;
this.memory [addr_idx] = mod_addr [0] ;
this.memory [addr_idx + 1] = mod_addr [1] ;
this.memory [addr_idx + 2] = mod_addr [2] ;
//this.mem_dump_message (this.current_instruction.bbb, 3) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // address_modify_operation //

//------------------------------------------------------------------------------
// branch_operation
//------------------------------------------------------------------------------
B500Processor.prototype.branch_operation = function ()
{

if (this.current_instruction.m & 0x01)
    {				    // Branch unconditional
    this.set_next_instruction (this.current_instruction.aaa) ;
    this.current_instruction.microseconds += 42 ;
    }
else
    {				    // Branch conditional
//self.postMessage ({action:'alert','alert':"branch_cond"}) ;
    if (this.conditional & CONDITION_LOW)
	{
//self.postMessage ({action:'alert','alert':"branch_cond:low"}) ;
    	this.set_next_instruction (this.current_instruction.aaa) ;
	}
    else if (this.conditional & CONDITION_HIGH)
	{
//self.postMessage ({action:'alert','alert':"branch_cond:high"}) ;
    	this.set_next_instruction (this.current_instruction.ccc) ;
	}
    else //if (this.conditional & CONDITION_EQUAL)
	{
//self.postMessage ({action:'alert','alert':"branch_cond:eql"}) ;
    	this.set_next_instruction (this.current_instruction.bbb) ;
	}
    this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;
    }

} // branch_operation //

//------------------------------------------------------------------------------
// compare_operation
//------------------------------------------------------------------------------
B500Processor.prototype.compare_operation = function ()
{
let comp_length = this.current_instruction.n & BCD_NUMERIC ;
let bit_pattern ;	// 0x3f - char, 0x0f - num, 0x30 - zone
let branch_type = 1 ;	// 1 - equal, 2 - unequal from M variant

if (comp_length <= 0)
    {
    comp_length = 12 ;
    }

//this.mem_dump_message (this.current_instruction.aaa, comp_length) ;
//this.mem_dump_message (this.current_instruction.bbb, comp_length) ;
switch (this.current_instruction.m & BCD_NUMERIC)
    {
    case 0x00 :			// char =
	bit_pattern = BCD_CHAR ;
	break ;
    case 0x01 :			// zone =
	bit_pattern = BCD_ZONE ;
	break ;
    case 0x02 :			// num =
	bit_pattern = BCD_NUMERIC ;
	break ;
    case 0x04 :			// char !=
	bit_pattern = BCD_CHAR ;
	branch_type = 2 ;
	break ;
    case 0x05 :			// zone !=
	bit_pattern = BCD_ZONE ;
	branch_type = 2 ;
	break ;
    case 0x06 :			// num !=
	bit_pattern = BCD_NUMERIC ;
	branch_type = 2 ;
	break ;
    default :
	return ;	// Fault
	break ;
    }

this.compare_characters
    (
    this.current_instruction.aaa ,		// compare from address
    this.current_instruction.bbb ,		// compare to address
    comp_length ,				// compare character length
    bit_pattern					// char, zone, or numeric
    ) ;

//self.postMessage ({action:'alert','alert':"comp cond:" + this.conditional.toString() }) ;
if (branch_type == 1)		// Branch if required
    {
    if (this.conditional & CONDITION_EQUAL)
        {			// Equal branch
//self.postMessage ({action:'alert','alert':"comp op: EQUAL exit"}) ;
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.ccc) ;
        }
    }
else
    {
    if (this.conditional & CONDITION_UNEQUAL)
        {			// Unequal branch
//self.postMessage ({action:'alert','alert':"comp op: UNEQUAL exit"}) ;
	this.instruction_idx_next
	    = this.address_to_index (this.current_instruction.ccc) ;
        }
    }

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // compare_operation //

//------------------------------------------------------------------------------
// data_compress_operation
//------------------------------------------------------------------------------
B500Processor.prototype.data_compress_operation = function ()
{
let from_idx = this.address_to_index (this.current_instruction.aaa) ;
let to_idx = this.address_to_index (this.current_instruction.ccc) ;
let record_length = ((this.current_instruction.bbb[0] & BCD_NUMERIC) * 120)
					+ ((this.current_instruction.bbb[1] & BCD_NUMERIC) * 12) 
					+ (this.current_instruction.bbb[1] & BCD_NUMERIC) ;
let from_end_idx = from_idx + record_length ;

while (from_idx < from_end_idx)
	{
	this.memory [to_idx] = 0x00 ;
	this.memory [to_idx] &= (this.memory [from_idx] << 2) & 0x3c ;
	from_idx ++ ;
	if (from_idx < from_end_idx)
		{
		this.memory [to_idx] &= (this.memory [from_idx] >> 2) & 0x03 ;
		to_idx++ ;
		this.memory [to_idx] = 0x00 ;
		this.memory [to_idx] &= (this.memory [from_idx] << 4) & BCD_ZONE ;
		from_idx ++ ;
		if (from_idx < from_end_idx)
			{
			this.memory [to_idx] &= (this.memory [from_idx]) & BCD_NUMERIC ;
			to_idx++ ;
			from_idx ++ ;
			}
		}
	}

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // data_compress_operation //

//------------------------------------------------------------------------------
// data_expand_operation
//------------------------------------------------------------------------------
B500Processor.prototype.data_expand_operation = function ()
{
let from_idx = this.address_to_index (this.current_instruction.aaa) ;
let to_idx = this.address_to_index (this.current_instruction.ccc) ;
let record_length = ((this.current_instruction.bbb[0] & BCD_NUMERIC) * 120)
					+ ((this.current_instruction.bbb[1] & BCD_NUMERIC) * 12) 
					+ (this.current_instruction.bbb[1] & BCD_NUMERIC) ;
let to_end_idx = to_idx + record_length ;

while (to_idx < to_end_idx)
	{
	this.memory [to_idx] = 0x00 ;
	this.memory [to_idx] &= (this.memory [from_idx] >> 2) & BCD_NUMERIC ;
	to_idx++ ;
	if (to_idx < to_end_idx)
		{
		this.memory [to_idx] = 0x00 ;
		this.memory [to_idx] &= (this.memory [from_idx] << 2) & 0x0c ;
		from_idx++ ;
		this.memory [to_idx] &= (this.memory [from_idx] >> 4) & 0x03 ;
		to_idx++ ;
		if (to_idx < to_end_idx)
			{
			this.memory [to_idx] = 0x00 ;
			this.memory [to_idx] &= this.memory [from_idx] & BCD_NUMERIC ;
			to_idx++ ;
			from_idx++ ;
			}
		}
	}

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // data_expand_operation //

//------------------------------------------------------------------------------
// divide_operation
//------------------------------------------------------------------------------
B500Processor.prototype.divide_operation = function ()
{
let dividend_length = this.current_instruction.m & BCD_NUMERIC ;
let divisor_length = this.current_instruction.n & BCD_NUMERIC ;
let quotient_length ;
let dividend ;
let divisor ;
let quotient ;
let remainder ;

if (dividend_length <= 0)
    {
    dividend_length = 12 ;
    }
dividend = this.bcd_to_integer (this.current_instruction.aaa,
				dividend_length) ;
if (divisor_length <= 0)
    {
    divisor_length = 12 ;
    }
divisor = this.bcd_to_integer (this.current_instruction.bbb,
				divisor_length) ;
if (divisor == 0)
    {
    return ;		// fault
    }
quotient_length = dividend_length - divisor_length ;
if (quotient_length <= 0)
    {
    return ;		// fault
    }

quotient = Math.floor (dividend / divisor) ;
remainder = Math.abs (dividend) % Math.abs (divisor) ;

this.integer_to_bcd (quotient,
			this.current_instruction.ccc,
			quotient_length) ;
this.integer_to_bcd (remainder ,
			this.current_instruction.aaa,
			dividend_length) ;

this.set_conditional (quotient) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // divide_operation //

//------------------------------------------------------------------------------
// halt_operation
//------------------------------------------------------------------------------
B500Processor.prototype.halt_operation = function ()
{

this.processor_halt = true ;

this.instruction_idx_next
    = this.address_to_index (this.current_instruction.aaa) ;

} // halt_operation //

//------------------------------------------------------------------------------
// interrogate_operation
//------------------------------------------------------------------------------
B500Processor.prototype.interrogate_operation = function ()
{


this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // interrogate_operation //

//------------------------------------------------------------------------------
// fiscal_mask
//------------------------------------------------------------------------------
B500Processor.prototype.fiscal_mask = function
    (
    b_comma ,
    b_decimal
    )
{
let from_idx = this.address_to_index (this.current_instruction.aaa) ;
let from_end_idx ;
let mask_idx = this.address_to_index (this.current_instruction.bbb) ;
let mask_end_idx ;
let to_idx = this.address_to_index (this.current_instruction.ccc) ;
let to_end_idx ;
let from_length = this.current_instruction.m & BCD_NUMERIC ;
let b_blank = this.ascii_to_bcd [' '] ;
let b_dollar = this.ascii_to_bcd ['$'] ;
let mask_char = ' ' ;
let insert_all = false ;

if (from_length > 11)
    {
    return ;			    // fault
    }

if (from_length == 0)
    {
    from_length = 12 ;
    }
from_end_idx = from_idx + from_length ;
mask_end_idx = mask_idx + 24 ;		// max length
to_end_idx = to_idx + 24 ;
//this.mem_dump_message (this.current_instruction.aaa, from_length) ;
//this.mem_dump_message (this.current_instruction.bbb, 20) ;

while (from_idx < from_end_idx
	&& mask_idx < mask_end_idx
	&& to_idx < to_end_idx)
    {
    if ((this.memory [from_idx] & BCD_NUMERIC) != 0x00)
	{
	insert_all = true ;
	}
    else if (this.memory [mask_idx] == b_decimal)
	{
	insert_all = true ;
	}
    else if (this.memory [mask_idx] == b_dollar)
	{
	//insert_all = true ;
	this.memory [to_idx] = this.memory [mask_idx] ;
    	to_idx++ ;
        mask_idx++ ;
	}
    if (insert_all)
	{
	if (this.memory [mask_idx] == b_comma
	    || this.memory [mask_idx] == b_decimal)
	    {
	    this.memory [to_idx] = this.memory [mask_idx] ;
	    }
	else
	    {
	    this.memory [to_idx] = this.memory [from_idx] & BCD_NUMERIC ;
            from_idx++ ;
	    }
	}
    else
	{
	if (this.memory [mask_idx] == b_comma
	    || this.memory [mask_idx] == b_decimal)
	    {
	    this.memory [to_idx] = mask_char ;
	    }
	else
	    {
	    this.memory [to_idx] = this.memory [mask_idx] ;
	    mask_char = this.memory [mask_idx] ;
            from_idx++ ;
	    }
	}
    to_idx++ ;
    mask_idx++ ;
//this.mem_dump_message (this.current_instruction.ccc, 26) ;
    }

if (mask_idx < mask_end_idx
	&& to_idx < to_end_idx)
    {
    from_idx-- ;					// test sign
    if (this.memory [from_idx] && 0x20)
        {						// negative
        this.memory [to_idx] = this.memory [mask_idx] ;
        }
    else
        {						// non-negative
        this.memory [to_idx] = b_blank ;
        }
    }
//this.mem_dump_message (this.current_instruction.ccc, 26) ;

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // fiscal_mask //

//------------------------------------------------------------------------------
// alphanumeric_mask
//------------------------------------------------------------------------------
B500Processor.prototype.alphanumeric_mask = function ()
{
let from_idx = this.address_to_index (this.current_instruction.aaa) ;
let from_end_idx ;
let mask_idx = this.address_to_index (this.current_instruction.bbb) ;
let to_idx = this.address_to_index (this.current_instruction.ccc) ;
let to_end_idx ;
let from_length = this.current_instruction.m & BCD_NUMERIC ;
let b_amp = this.ascii_to_bcd ['&'] ;

if (from_length > 11)
    {
    return ;			    // fault
    }

if (from_length == 0)
    {
    from_length = 12 ;
    }
from_end_idx = from_idx + from_length ;
to_end_idx = to_idx + 24 ;

while (from_idx < from_end_idx
	&& to_idx < to_end_idx)
    {
    if (this.memory [mask_idx] == b_amp)
	{			    // insert source character
	this.memory [to_idx] = this.memory [from_idx] ;
	from_idx++ ;
	}
    else
	{			    // insert mask character
	this.memory [to_idx] = this.memory [mask_idx] ;
	}
    to_idx++ ;
    mask_idx++ ;
//this.mem_dump_message (this.current_instruction.ccc, 26) ;
    }

this.set_conditional (0) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // alphanumeric_mask //

//------------------------------------------------------------------------------
// mask_operation
//------------------------------------------------------------------------------
B500Processor.prototype.mask_operation = function ()
{
let b_comma = this.ascii_to_bcd [','] ;
let b_decimal = this.ascii_to_bcd ['.'] ;

switch (this.current_instruction.n & BCD_NUMERIC)
    {
    case 0 :					// fiscal standard
	this.fiscal_mask (b_comma, b_decimal) ;
        break ;
    case 1 :					// fiscal inverted
	this.fiscal_mask (b_decimal, b_comma) ;
        break ;
    default :					// alphanumeric
	this.alphanumeric_mask (b_decimal, b_comma) ;
        break ;
    }

} // mask_operation //

//------------------------------------------------------------------------------
// multiply_operation
//------------------------------------------------------------------------------
B500Processor.prototype.multiply_operation = function ()
{
let multiplicand_length = this.current_instruction.m & BCD_NUMERIC ;
let multiplier_length = this.current_instruction.n & BCD_NUMERIC ;
let multiplicand ;
let multiplier ;
let product ;

if (multiplicand_length <= 0)
    {
    multiplicand_length = 12 ;
    }
multiplicand = this.bcd_to_integer (this.current_instruction.aaa,
				multiplicand_length) ;
if (multiplier_length <= 0)
    {
    multiplier_length = 12 ;
    }
multiplier = this.bcd_to_integer (this.current_instruction.bbb,
				multiplier_length) ;

product = multiplier * multiplicand ;

this.integer_to_bcd (product,
			this.current_instruction.ccc,
			(multiplicand_length + multiplier_length)) ;

this.set_conditional (product) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // multiply_operation //

//------------------------------------------------------------------------------
// nop_operation
//------------------------------------------------------------------------------
B500Processor.prototype.nop_operation = function ()
{

this.current_instruction.microseconds += 10 ;

} // nop_operation //

//------------------------------------------------------------------------------
// print_operation
//------------------------------------------------------------------------------
B500Processor.prototype.print_operation = function ()
{
//let not_ready_idx = this.address_to_index (this.current_instruction.aaa) ;
//let eof_idx = this.address_to_index (this.current_instruction.bbb) ;
//let input_idx = this.address_to_index (this.current_instruction.ccc) ;


this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // print_operation //

//------------------------------------------------------------------------------
// spo_print
//------------------------------------------------------------------------------
B500Processor.prototype.spo_print = function ()
{
let output_idx = this.address_to_index (this.current_instruction.aaa) ;
let text_out = '' ;
let mess = {'action':'spo'} ;
//this.inst_dump_message () ;

while (text_out.length <= 80)
	{
	if (this.memory[output_idx] == 0x1f)
		{
		break ;
		}
	text_out += this.bcd [this.memory [output_idx]].toString () ;
	output_idx++
	}

//this.mem_dump_message (this.current_instruction.aaa, 26) ;
this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // spo_print //

//------------------------------------------------------------------------------
// spo_read
//------------------------------------------------------------------------------
B500Processor.prototype.spo_read = function ()
{
let input_branch_idx = this.address_to_index (this.current_instruction.bbb) ;
let output_idx = this.address_to_index (this.current_instruction.ccc) ;


//this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // spo_read //

//------------------------------------------------------------------------------
// spo_operation
//------------------------------------------------------------------------------
B500Processor.prototype.spo_operation = function ()
{

switch (this.current_instruction.m & BCD_NUMERIC)
    {
    case 1 :					// spo print
	this.spo_print () ;
        break ;
    case 2 :					// spo read
	this.spo_read () ;
        break ;
    default :					// fault
this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;
        break ;
    }

} // spo_operation //

//------------------------------------------------------------------------------
// subtract_operation
//------------------------------------------------------------------------------
B500Processor.prototype.subtract_operation = function ()
{
let minuend_length = this.current_instruction.m & BCD_NUMERIC ;
let subtrahend_length = this.current_instruction.n & BCD_NUMERIC ;
let minuend ;
let subtrahend ;
let difference ;

if (minuend_length <= 0)
    {
    minuend_length = 12 ;
    }
minuend = this.bcd_to_integer (this.current_instruction.aaa,
				minuend_length) ;
if (subtrahend_length <= 0)
    {
    subtrahend_length = 12 ;
    }
subtrahend = this.bcd_to_integer (this.current_instruction.bbb,
				subtrahend_length) ;

difference = minuend - subtrahend ;

this.integer_to_bcd (difference ,
			this.current_instruction.ccc,
			Math.max (minuend_length, subtrahend_length)) ;

this.set_conditional (difference) ;

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // subtract_operation //

//------------------------------------------------------------------------------
// transfer_operation
//------------------------------------------------------------------------------
B500Processor.prototype.transfer_operation = function ()
{
let fields = this.current_instruction.m & BCD_NUMERIC ;
let chars = this.current_instruction.n & BCD_NUMERIC ;
let length ;
// validate m/n

length = (fields * 12) + chars ;
if (length == 0)
    {
    length = 120 ;
    }

this.transfer_characters
    (
    this.current_instruction.aaa ,
    this.current_instruction.ccc ,
    length ,
    BCD_CHAR
    ) ;

if (this.current_instruction.n & 0x20)	// N var B bit
    {
    this.instruction_idx_next
        = this.address_to_index (this.current_instruction.bbb) ;
    }

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // transfer_operation //

//------------------------------------------------------------------------------
// transfer_zone_operation
//------------------------------------------------------------------------------
B500Processor.prototype.transfer_zone_operation = function ()
{
let fields = this.current_instruction.m & BCD_NUMERIC ;
let chars = this.current_instruction.n & BCD_NUMERIC ;

// validate m/n

if (fields == 0)
    {
    fields = 11 ;
    chars = 0 ;
    }

this.transfer_characters
    (
    this.current_instruction.aaa ,
    this.current_instruction.ccc ,
    (fields * 12) + chars ,
    BCD_ZONE
    ) ;

if (this.current_instruction.n & 0x20)	// N var B bit
    {
    this.instruction_idx_next
        = this.address_to_index (this.current_instruction.bbb) ;
    }

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // transfer_zone_operation //

//------------------------------------------------------------------------------
// invalid_operation - Invalid op code
//------------------------------------------------------------------------------
B500Processor.prototype.invalid_operation = function ()
{

this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // invalid_operation //

//##############################################################################
// input/output functions
//##############################################################################

//------------------------------------------------------------------------------
// io_output_initialize
//------------------------------------------------------------------------------
B500Processor.prototype.io_output_initialize = function
    (
    device
    )
{
let io_message =
    {
    "action" : "io_output" ,
    "device" : device ,
    "status" : 0 ,
    "data" : ""
    } ;

switch (device)
    {
    case "punch" :
	break ;
    case "printer" :
	break ;
    case "disk" :
	break ;
    default:
	break ;
    }

this.io_pending = device ;
return (io_message) ;

} // io_output_initialize //

//------------------------------------------------------------------------------
// io_input_initialize
//------------------------------------------------------------------------------
B500Processor.prototype.io_input_initialize = function
    (
    device
    )
{
let io_message =
    {
    "action" : "io_input" ,
    "device" : device ,
    "status" : 0
    } ;

switch (device)
    {
    case "card" :
	io_message.buffer = 1 ;
	break ;
    case "disk" :
	break ;
    default:
	break ;
    }

this.io_pending = device ;
return (io_message) ;

} // io_input_initialize //

//------------------------------------------------------------------------------
// card_read_operation
//------------------------------------------------------------------------------
B500Processor.prototype.card_read_operation = function ()
{
let io_message = this.io_input_initialize ("card") ;


self.postMessage (io_message) ;


this.set_conditional (0) ;

//this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // card_read_operation //

//------------------------------------------------------------------------------
// card_punch_operation
//------------------------------------------------------------------------------
B500Processor.prototype.card_punch_operation = function ()
{
let io_message = this.io_output_initialize ("punch") ;


self.postMessage (io_message) ;


this.set_conditional (0) ;

//this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // card_punch_operation //

//------------------------------------------------------------------------------
// printer_operation
//------------------------------------------------------------------------------
B500Processor.prototype.printer_operation = function ()
{
let io_message = this.io_output_initialize ("printer") ;


self.postMessage (io_message) ;


this.set_conditional (0) ;

//this.current_instruction.microseconds += DEFAULT_INSTRUCTION_MICROSECONDS ;

} // printer_operation //

//------------------------------------------------------------------------------
// disk_operation
//------------------------------------------------------------------------------
B500Processor.prototype.disk_operation = function ()
{
let segment ;
let segment_cnt ;
let mem_idx ;
let result = {error : DISK_NOT_READY} ;

this.update_indicator_light ('disk_file_data_com_light', true) ;

switch (this.current_instruction.m & BCD_NUMERIC)
    {
    case 0 :
	segment = this.bcd_to_integer
	    (
            this.current_instruction.aaa ,
	    7 
	    ) ;
	segment_cnt = this.current_instruction.n & BCD_NUMERIC ;
	memory_idx = this.address_to_index (this.current_instruction.bbb) ;
	result = this.disk.write (segment, segment_cnt, memory_idx) ;
        break ;
    case 2 :
	segment = this.bcd_to_integer
	    (
            this.current_instruction.aaa ,
	    7 
	    ) ;
	segment_cnt = this.current_instruction.n & BCD_NUMERIC ;
	memory_idx = this.address_to_index (this.current_instruction.bbb) ;
	result = this.disk.read (segment, segment_cnt, memory_idx) ;
//this.mem_dump_message (this.current_instruction.bbb, 30) ;
	break ;
    case 4 :
//self.postMessage ({action:'alert','alert':"DFC"}) ;
	segment = this.bcd_to_integer
	    (
            this.current_instruction.aaa ,
	    7 
	    ) ;
	segment_cnt = this.current_instruction.n & BCD_NUMERIC ;
	result = this.disk.check (segment, segment_cnt) ;
        break ;
    case 8 :
//self.postMessage ({action:'alert','alert':"DFI"}) ;
	result = this.disk.interrogate () ;
        break ;
    default :
        break ;
    }


//this.wait = 200 ;

} // disk_operation //

//##############################################################################
// Debug/Utility functions
//##############################################################################

//------------------------------------------------------------------------------
// mem_dump_message
//------------------------------------------------------------------------------
B500Processor.prototype.mem_dump_message = function
    (
    addr ,
    len
    )
{
let mess = {'action':'memdump'} ;
let text = '' ;
let idx ;
let mem_idx = this.address_to_index (addr) ;

for (idx = 0 ; idx < addr.length ; idx++)
    {
    text += this.bcd [addr [idx]].ascii ;
    }
text += ':' ;

for (idx = 0 ; idx < len ; idx++)
    {
    text += this.bcd [this.memory [mem_idx + idx]].ascii ;
    }

mess.text = text ;
if (DEBUG)
    {
    self.postMessage (mess) ;
    }

} // mem_dump_message //

//------------------------------------------------------------------------------
// inst_dump_message
//------------------------------------------------------------------------------
B500Processor.prototype.inst_dump_message = function ()
{

this.mem_dump_message (this.current_instruction.address, 12) ;

} // inst_dump_message //

//##############################################################################

let processor = new B500Processor ;

//self.addEventListener('message', function(e)
onmessage = function(e)
{
let data = e.data;

switch (data.action)
    {
    case 'hello':
	self.postMessage (data) ;
	break ;
    case 'button_pressed':
	//self.postMessage ({'action':'alert', 'alert': data.action}) ;
	switch (data.button)
	    {
	    case 'read':
		processor.read_button () ;
		break ;
	    case 'memory_increase_read':
		processor.increase_address_and_read_button () ;
		break ;
	    case 'clear':
		processor.clear_button () ;
		break ;
	    case 'halt':
		processor.halt_button () ;
		break ;
	    case 'continue':
		processor.continue_button () ;
		break ;
	    case 'sense_switch_6':
	    case 'sense_switch_5':
	    case 'sense_switch_4':
	    case 'sense_switch_3':
	    case 'sense_switch_2':
	    case 'sense_switch_1':
		processor.toggle_sense_switch (data.button) ;
		break ;
	    case 'single_inst':
		processor.single_inst_button () ;
		break ;
	    default:
		break ;
	    }
      //self.postMessage(result);
      break;
    default:
      self.postMessage('Unknown command');
  }
}

