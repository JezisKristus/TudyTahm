﻿using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace TT_API.DTOs {
    public class CreateMapDTO {
        public int IDUser { get; set; }
        public string MapName { get; set; }

        public string MapDescription { get; set; }

    }
}
