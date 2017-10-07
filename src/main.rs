#![no_main]

/*
#![feature(link_args)]
#[link_args = "-s EXPORTED_FUNCTIONS=['_hello_world']"]
extern {}
*/

extern crate rustybrot_lib;
use rustybrot_lib::*;

#[no_mangle]
pub fn get_buddhabrot(array:*mut u16, size_x: usize, size_y: usize, x_min:f32, x_max:f32, y_min:f32, y_max:f32, min_iteration:u32, max_iteration: u32, num_sample: u32) -> u16 {
	let mut image = unsafe {
        std::slice::from_raw_parts_mut(array, size_x*size_y)
    };

    for i in image.iter_mut() {
    	*i = 0;
    }

    let mut fitted_x_min: f32 = x_min;
    let mut fitted_x_max: f32 = x_max;
    let mut fitted_y_min: f32 = y_min;
    let mut fitted_y_max: f32 = y_max;

    //let screen_ratio = size_x as f32 / size_y as f32;
    //fit_to_ratio(screen_ratio*(y_max-y_min)/(x_max-x_min), &mut fitted_x_min, &mut fitted_x_max, &mut fitted_y_min, &mut fitted_y_max).expect("failed to fit to screen ratio");

    let max = gen_buddhabrot(size_x, size_y, fitted_x_min, fitted_x_max, fitted_y_min, fitted_y_max, min_iteration, max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
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

    let mut fitted_x_min: f64 = x_min;
    let mut fitted_x_max: f64 = x_max;
    let mut fitted_y_min: f64 = y_min;
    let mut fitted_y_max: f64 = y_max;

    //let screen_ratio = size_x as f64 / size_y as f64;
    //fit_to_ratio(screen_ratio*(y_max-y_min)/(x_max-x_min), &mut fitted_x_min, &mut fitted_x_max, &mut fitted_y_min, &mut fitted_y_max).expect("failed to fit to screen ratio");

    let max = gen_buddhabrot_metropolis(size_x, size_y, fitted_x_min, fitted_x_max, fitted_y_min, fitted_y_max, min_iteration, max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
    return max;
}

#[no_mangle]
pub fn get_buddhabrot_metropolis_color(array:*mut u16, size_x: usize, size_y: usize, x_min:f64, x_max:f64, y_min:f64, y_max:f64, red_min_iteration: u32, red_max_iteration: u32, green_min_iteration: u32, green_max_iteration: u32, blue_min_iteration: u32, blue_max_iteration: u32, num_sample: u32) {
    let mut image = unsafe {
        std::slice::from_raw_parts_mut(array, size_x*size_y)
    };

    for i in image.iter_mut() {
        *i = 0;
    }

    //let screen_ratio = size_x as f64 / size_y as f64;
    //fit_to_ratio(screen_ratio*(y_max-y_min)/(x_max-x_min), &mut fitted_x_min, &mut fitted_x_max, &mut fitted_y_min, &mut fitted_y_max).expect("failed to fit to screen ratio");

    gen_buddhabrot_metropolis_color(size_x, size_y, x_min, x_max, y_min, y_max, red_min_iteration, red_max_iteration, green_min_iteration, green_max_iteration, blue_min_iteration, blue_max_iteration, num_sample, &mut image).expect("failed to gen buddhabrot");
}