package com.guruprasad.portfolio.learning.repository;

import com.guruprasad.portfolio.learning.entity.Course;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CourseRepository extends MongoRepository<Course, String> {

    Sort PAGE_ORDER = Sort.by("group", "order", "id");

    long countByGroup(String group);

    default List<Course> inPageOrder() {
        return findAll(PAGE_ORDER);
    }
}
