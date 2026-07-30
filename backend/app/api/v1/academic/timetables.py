from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter()

TIMETABLES = [
    {
        "id": "7th_sem_a_1",
        "day_of_week": "Monday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_2",
        "day_of_week": "Monday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_3",
        "day_of_week": "Monday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_4",
        "day_of_week": "Monday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_5",
        "day_of_week": "Tuesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_6",
        "day_of_week": "Tuesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_7",
        "day_of_week": "Tuesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_8",
        "day_of_week": "Tuesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_9",
        "day_of_week": "Wednesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_10",
        "day_of_week": "Wednesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_11",
        "day_of_week": "Wednesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_12",
        "day_of_week": "Wednesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_13",
        "day_of_week": "Wednesday",
        "start_time": "01:30 PM",
        "end_time": "03:30 PM",
        "subject_name": "NoSQL Database Lab",
        "classroom_code": "BCSNS701",
        "classroom_name": "M301",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_14",
        "day_of_week": "Thursday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_15",
        "day_of_week": "Thursday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_16",
        "day_of_week": "Thursday",
        "start_time": "01:30 PM",
        "end_time": "04:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_17",
        "day_of_week": "Friday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_18",
        "day_of_week": "Friday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_a_19",
        "day_of_week": "Friday",
        "start_time": "01:30 PM",
        "end_time": "04:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M408",
        "section": "7th Sem A"
    },
    {
        "id": "7th_sem_b_1",
        "day_of_week": "Monday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_2",
        "day_of_week": "Monday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_3",
        "day_of_week": "Monday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_4",
        "day_of_week": "Monday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_5",
        "day_of_week": "Tuesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_6",
        "day_of_week": "Tuesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_7",
        "day_of_week": "Tuesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_8",
        "day_of_week": "Tuesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_9",
        "day_of_week": "Wednesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_10",
        "day_of_week": "Wednesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_11",
        "day_of_week": "Wednesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_12",
        "day_of_week": "Wednesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_13",
        "day_of_week": "Wednesday",
        "start_time": "01:30 PM",
        "end_time": "03:30 PM",
        "subject_name": "NoSQL Database Lab",
        "classroom_code": "BCSNS701",
        "classroom_name": "M302",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_14",
        "day_of_week": "Thursday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_15",
        "day_of_week": "Thursday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_16",
        "day_of_week": "Friday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_b_17",
        "day_of_week": "Friday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M409",
        "section": "7th Sem B"
    },
    {
        "id": "7th_sem_c_1",
        "day_of_week": "Monday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_2",
        "day_of_week": "Monday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_3",
        "day_of_week": "Monday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_4",
        "day_of_week": "Monday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_5",
        "day_of_week": "Tuesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_6",
        "day_of_week": "Tuesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_7",
        "day_of_week": "Tuesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_8",
        "day_of_week": "Tuesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_9",
        "day_of_week": "Tuesday",
        "start_time": "01:30 PM",
        "end_time": "03:30 PM",
        "subject_name": "NoSQL Database Lab",
        "classroom_code": "BCSNS701",
        "classroom_name": "M301",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_10",
        "day_of_week": "Wednesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_11",
        "day_of_week": "Wednesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_12",
        "day_of_week": "Wednesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_13",
        "day_of_week": "Wednesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_14",
        "day_of_week": "Thursday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_15",
        "day_of_week": "Thursday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_16",
        "day_of_week": "Thursday",
        "start_time": "01:30 PM",
        "end_time": "04:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_17",
        "day_of_week": "Friday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_18",
        "day_of_week": "Friday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_c_19",
        "day_of_week": "Friday",
        "start_time": "01:30 PM",
        "end_time": "04:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M410",
        "section": "7th Sem C"
    },
    {
        "id": "7th_sem_d_1",
        "day_of_week": "Monday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_2",
        "day_of_week": "Monday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_3",
        "day_of_week": "Monday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_4",
        "day_of_week": "Monday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_5",
        "day_of_week": "Tuesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_6",
        "day_of_week": "Tuesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_7",
        "day_of_week": "Tuesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_8",
        "day_of_week": "Tuesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_9",
        "day_of_week": "Tuesday",
        "start_time": "01:30 PM",
        "end_time": "03:30 PM",
        "subject_name": "NoSQL Database Lab",
        "classroom_code": "BCSNS701",
        "classroom_name": "M302",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_10",
        "day_of_week": "Wednesday",
        "start_time": "08:00 AM",
        "end_time": "09:00 AM",
        "subject_name": "Storage Area Networks",
        "classroom_code": "BCSSA714",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_11",
        "day_of_week": "Wednesday",
        "start_time": "09:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "NoSQL Database",
        "classroom_code": "BCSNS701",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_12",
        "day_of_week": "Wednesday",
        "start_time": "10:30 AM",
        "end_time": "11:30 AM",
        "subject_name": "PE-III BDA/CSF",
        "classroom_code": "PE-III",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_13",
        "day_of_week": "Wednesday",
        "start_time": "11:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "UI/UX Design",
        "classroom_code": "BCSUI702",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_14",
        "day_of_week": "Thursday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_15",
        "day_of_week": "Thursday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_16",
        "day_of_week": "Thursday",
        "start_time": "02:30 PM",
        "end_time": "04:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_17",
        "day_of_week": "Friday",
        "start_time": "08:00 AM",
        "end_time": "10:00 AM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_18",
        "day_of_week": "Friday",
        "start_time": "10:30 AM",
        "end_time": "12:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    },
    {
        "id": "7th_sem_d_19",
        "day_of_week": "Friday",
        "start_time": "02:30 PM",
        "end_time": "04:30 PM",
        "subject_name": "Major Project (Phase-I)",
        "classroom_code": "BCSPR785",
        "classroom_name": "Classroom-M411",
        "section": "7th Sem D"
    }
]

@router.get("")
def get_timetables(section: Optional[str] = Query(None)):
    if section:
        return [t for t in TIMETABLES if t.get("section") == section]
    return TIMETABLES
