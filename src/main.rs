#![no_main]

extern crate rustybrot_lib;
use rustybrot_lib::*;

#[no_mangle]
pub fn get_compose(size: usize, cumulated_result_p: *mut u16, compositor_result_p: *mut u8)  {
    let cumulated_result = unsafe {
        std::slice::from_raw_parts_mut(cumulated_result_p, size*3)
    };
    let compositor_result = unsafe {
        std::slice::from_raw_parts_mut(compositor_result_p, size*4)
    };
    compose(cumulated_result, compositor_result);
}

#[no_mangle]
pub fn get_buddhabrot(array:*mut u16, size_x: usize, size_y: usize, x_min:f32, x_max:f32, y_min:f32, y_max:f32, min_iteration:u32, max_iteration: u32, num_sample: u32) -> u16 {
	let mut image = unsafe {
        std::slice::from_raw_parts_mut(array, size_x*size_y)
    };

    for i in image.iter_mut() {
    	*i = 0;
    }

    let max = gen_buddhabrot(size_x, size_y, x_min, x_max, y_min, y_max, min_iteration, max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
    return max;
}

#[no_mangle]
pub fn get_buddhabrot_metropolis(array:*mut u16, size_x: usize, size_y: usize, x_min:f64, x_max:f64, y_min:f64, y_max:f64, min_iteration:u32, max_iteration: u32, num_sample: u32) -> u16 {
    let mut image = unsafe {
        std::slice::from_raw_parts_mut(array, size_x*size_y)
    };

    for i in image.iter_mut() {
        *i = 0;
    }

    let max = gen_buddhabrot_metropolis(size_x, size_y, x_min, x_max, y_min, y_max, min_iteration, max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
    return max;
}

#[no_mangle]
pub fn get_buddhabrot_color(array:*mut u16, size_x: usize, size_y: usize, x_min:f32, x_max:f32, y_min:f32, y_max:f32, red_min_iteration: u32, red_max_iteration: u32, green_min_iteration: u32, green_max_iteration: u32, blue_min_iteration: u32, blue_max_iteration: u32, num_sample: u32) {
    let mut image = unsafe {
        std::slice::from_raw_parts_mut(array, size_x*size_y*3)
    };

    for i in image.iter_mut() {
        *i = 0;
    }

    gen_buddhabrot_color(size_x, size_y, x_min, x_max, y_min, y_max, red_min_iteration, red_max_iteration, green_min_iteration, green_max_iteration, blue_min_iteration, blue_max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
}

#[no_mangle]
pub fn get_buddhabrot_metropolis_color(array:*mut u16, size_x: usize, size_y: usize, x_min:f64, x_max:f64, y_min:f64, y_max:f64, red_min_iteration: u32, red_max_iteration: u32, green_min_iteration: u32, green_max_iteration: u32, blue_min_iteration: u32, blue_max_iteration: u32, num_sample: u32) {
    let mut image = unsafe {
        std::slice::from_raw_parts_mut(array, size_x*size_y*3)
    };

    for i in image.iter_mut() {
        *i = 0;
    }

    gen_buddhabrot_metropolis_color(size_x, size_y, x_min, x_max, y_min, y_max, red_min_iteration, red_max_iteration, green_min_iteration, green_max_iteration, blue_min_iteration, blue_max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
}

